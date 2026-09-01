const express = require('express');
const router = express.Router();
const { TEAMS_2026 } = require('../db/teamsData');
const db = require('../db/database');
const { optionalAuth } = require('../middleware/auth');
const { calculateBettingLine } = require('../services/oddsService');
const espnService = require('../services/espnService');

// GET /api/teams
router.get('/', optionalAuth, async (req, res) => {
  try {
    const conference = req.query.conference;
    let teams = TEAMS_2026;

    if (conference && conference !== 'ALL') {
      const confLower = conference.toLowerCase();
      teams = teams.filter(t => t.conference.toLowerCase().includes(confLower) || (confLower === 'ind' && t.conference.toLowerCase().includes('ind')));
    }

    // Fetch live ESPN real-world standings/records map
    const standingsMap = await espnService.getStandingsMap().catch(() => new Map());

    // Calculate user's projected record for each team if logged in
    let userPicksMap = new Map();
    if (req.user) {
      const picks = await db.prepare(`SELECT * FROM picks WHERE user_id = ? AND (season_year = 2026 OR season_year = '2026')`).all(req.user.id);
      picks.forEach(p => userPicksMap.set(p.game_id, p));
    }

    // Fetch all schedules in one query for speed
    const allSchedules = await db.prepare(`
      SELECT * FROM team_schedules 
      WHERE (season_year = 2026 OR season_year = '2026')
      ORDER BY week_number ASC
    `).all();

    const schedulesByTeam = new Map();
    for (const s of allSchedules) {
      if (!schedulesByTeam.has(s.team_id)) {
        schedulesByTeam.set(s.team_id, []);
      }
      schedulesByTeam.get(s.team_id).push(s);
    }

    const teamsWithRecords = teams.map(team => {
      const teamSchedules = schedulesByTeam.get(team.id) || [];

      let projectedWins = 0;
      let projectedLosses = 0;

      const tName = (team.name || '').toLowerCase();
      const tNick = (team.nickname || '').toLowerCase();
      const tAbbr = (team.abbreviation || '').toLowerCase();
      const tId = (team.id || '').toLowerCase();

      for (const s of teamSchedules) {
        const userPick = userPicksMap.get(s.game_id);
        if (userPick) {
          const pickedName = (userPick.predicted_winner_name || '').toLowerCase();
          const pickedId = (userPick.predicted_winner_id || '').toLowerCase();

          const isWin = (
            pickedId === tId ||
            (tId && pickedId.includes(tId)) ||
            (pickedName && tName && (pickedName.includes(tName) || tName.includes(pickedName))) ||
            (tNick && pickedName.includes(tNick)) ||
            (tAbbr && pickedName === tAbbr)
          );

          if (isWin) {
            projectedWins++;
          } else {
            projectedLosses++;
          }
        }
      }

      const totalScheduled = teamSchedules.length || 12;

      // Real-world record from ESPN
      const espnInfo = standingsMap.get(String(team.espnId)) || standingsMap.get(tName) || standingsMap.get(tId);
      const currentRecord = espnInfo?.overall || '0-0';
      const conferenceRecord = espnInfo?.conference || '0-0';

      return {
        ...team,
        currentRecord,
        conferenceRecord,
        totalGamesScheduled: totalScheduled,
        projectedRecord: {
          wins: projectedWins,
          losses: projectedLosses,
          unpicked: Math.max(0, totalScheduled - (projectedWins + projectedLosses))
        }
      };
    });

    return res.json({ teams: teamsWithRecords, count: teamsWithRecords.length });
  } catch (err) {
    console.error('Teams fetch error:', err);
    return res.status(500).json({ error: 'Failed to retrieve teams' });
  }
});

// GET /api/teams/:id/schedule (Pulls verified official 2026 ESPN schedule with betting lines & lockout)
router.get('/:id/schedule', optionalAuth, async (req, res) => {
  try {
    const teamId = req.params.id.toLowerCase();
    const team = TEAMS_2026.find(t => t.id === teamId || t.name.toLowerCase() === teamId || t.abbreviation.toLowerCase() === teamId);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Pull real-world standings/record for this team
    const standingsMap = await espnService.getStandingsMap().catch(() => new Map());
    const espnInfo = standingsMap.get(String(team.espnId)) || standingsMap.get(team.name.toLowerCase()) || standingsMap.get(team.id.toLowerCase());
    const currentRecord = espnInfo?.overall || '0-0';
    const conferenceRecord = espnInfo?.conference || '0-0';

    // Pull from team_schedules table
    const schedules = await db.prepare(`
      SELECT * FROM team_schedules 
      WHERE team_id = ? AND (season_year = 2026 OR season_year = '2026')
      ORDER BY week_number ASC, game_date ASC
    `).all(team.id);

    // Fetch user picks
    let userPicksMap = new Map();
    if (req.user) {
      const picks = await db.prepare(`SELECT * FROM picks WHERE user_id = ? AND (season_year = 2026 OR season_year = '2026')`).all(req.user.id);
      picks.forEach(p => userPicksMap.set(p.game_id, p));
    }

    const now = new Date();

    const tName = (team.name || '').toLowerCase();
    const tNick = (team.nickname || '').toLowerCase();
    const tAbbr = (team.abbreviation || '').toLowerCase();
    const tId = (team.id || '').toLowerCase();

    const scheduleList = schedules.map(s => {
      const userPick = userPicksMap.get(s.game_id) || null;
      let userPrediction = null;

      if (userPick) {
        const pickedName = (userPick.predicted_winner_name || '').toLowerCase();
        const pickedId = (userPick.predicted_winner_id || '').toLowerCase();

        const isWin = (
          pickedId === tId ||
          (tId && pickedId.includes(tId)) ||
          (pickedName && tName && (pickedName.includes(tName) || tName.includes(pickedName))) ||
          (tNick && pickedName.includes(tNick)) ||
          (tAbbr && pickedName === tAbbr)
        );

        userPrediction = {
          gameId: s.game_id,
          pickId: userPick.id,
          predictedWinnerId: userPick.predicted_winner_id,
          predictedWinnerName: userPick.predicted_winner_name,
          confidenceLevel: userPick.confidence_level || null,
          confidencePoints: userPick.confidence_points,
          isWinForTeam: isWin,
          isCorrect: userPick.is_correct,
          pointsAwarded: userPick.points_awarded
        };
      }

      // 1-hour before kickoff lockout calculation
      const gameTime = new Date(s.game_date);
      const isPastGame = gameTime < now;
      const isLocked = (gameTime.getTime() - now.getTime()) <= (60 * 60 * 1000);

      // Betting line
      const odds = calculateBettingLine({
        homeTeamName: s.is_home ? team.name : s.opponent_name,
        homeRank: s.is_home ? team.ranking : s.opponent_rank,
        awayTeamName: s.is_home ? s.opponent_name : team.name,
        awayRank: s.is_home ? s.opponent_rank : team.ranking,
        isHome: s.is_home === 1
      });

      const oppLogo = s.opponent_logo || 'https://a.espncdn.com/i/teamlogos/ncaa/500/7.png';

      return {
        gameId: s.game_id,
        week: s.week_number,
        date: s.game_date,
        opponent: {
          name: s.opponent_name,
          logo: oppLogo,
          rank: s.opponent_rank
        },
        opponentName: s.opponent_name,
        opponentLogo: oppLogo,
        opponentRank: s.opponent_rank,
        isHome: s.is_home === 1,
        venue: s.venue_name,
        broadcast: s.broadcast,
        status: s.status,
        statusDetail: s.status_detail,
        isFinal: s.status === 'STATUS_FINAL',
        teamScore: s.team_score,
        opponentScore: s.opponent_score,
        isLocked,
        isPastGame,
        odds,
        bettingLine: odds,
        userPrediction: userPrediction ? (userPrediction.isWinForTeam ? 'WIN' : 'LOSS') : null,
        userPick: userPrediction
      };
    });

    return res.json({
      team: {
        ...team,
        currentRecord,
        conferenceRecord
      },
      schedule: scheduleList,
      totalGames: scheduleList.length
    });
  } catch (err) {
    console.error('Team schedule error:', err);
    return res.status(500).json({ error: 'Failed to retrieve team schedule' });
  }
});

module.exports = router;
