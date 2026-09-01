const express = require('express');
const router = express.Router();
const { TEAMS_2026 } = require('../db/teamsData');
const db = require('../db/database');
const { optionalAuth } = require('../middleware/auth');
const { calculateBettingLine } = require('../services/oddsService');

// GET /api/teams
router.get('/', optionalAuth, (req, res) => {
  try {
    const conference = req.query.conference;
    let teams = TEAMS_2026;

    if (conference && conference !== 'ALL') {
      const confLower = conference.toLowerCase();
      teams = teams.filter(t => t.conference.toLowerCase().includes(confLower) || (confLower === 'ind' && t.conference.toLowerCase().includes('ind')));
    }

    // Calculate user's projected record for each team if logged in
    let userPicksMap = new Map();
    if (req.user) {
      const picks = db.prepare(`SELECT * FROM picks WHERE user_id = ? AND season_year = 2026`).all(req.user.id);
      picks.forEach(p => userPicksMap.set(p.game_id, p));
    }

    const teamsWithRecords = teams.map(team => {
      const teamSchedules = db.prepare(`
        SELECT * FROM team_schedules 
        WHERE team_id = ? AND (season_year = 2026 OR season_year = '2026')
        ORDER BY week_number ASC
      `).all(team.id);

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
      return {
        ...team,
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
router.get('/:id/schedule', optionalAuth, (req, res) => {
  try {
    const teamId = req.params.id.toLowerCase();
    const team = TEAMS_2026.find(t => t.id === teamId || t.name.toLowerCase() === teamId || t.abbreviation.toLowerCase() === teamId);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Pull from team_schedules table
    const schedules = db.prepare(`
      SELECT * FROM team_schedules 
      WHERE team_id = ? AND season_year = 2026
      ORDER BY week_number ASC, game_date ASC
    `).all(team.id);

    // Fetch user picks
    let userPicksMap = new Map();
    if (req.user) {
      const picks = db.prepare(`SELECT * FROM picks WHERE user_id = ? AND season_year = 2026`).all(req.user.id);
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

        userPrediction = isWin ? 'WIN' : 'LOSS';
      }

      const gameDate = new Date(s.game_date);
      const isPastDate = gameDate <= now;
      const isFinal = s.status === 'STATUS_FINAL';
      const isInProgress = s.status === 'STATUS_IN_PROGRESS';
      const isLocked = isPastDate || isFinal || isInProgress;

      // Calculate or extract betting line
      const homeTeam = s.is_home === 1 ? team.name : s.opponent_name;
      const homeRank = s.is_home === 1 ? team.ranking : s.opponent_rank;
      const awayTeam = s.is_home === 1 ? s.opponent_name : team.name;
      const awayRank = s.is_home === 1 ? s.opponent_rank : team.ranking;

      const odds = calculateBettingLine({
        homeTeamName: homeTeam,
        homeRank,
        awayTeamName: awayTeam,
        awayRank,
        isHome: s.is_home === 1
      });

      return {
        gameId: s.game_id,
        week: s.week_number,
        date: s.game_date,
        isHome: s.is_home === 1,
        opponent: {
          name: s.opponent_name,
          logo: s.opponent_logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/7.png`,
          rank: s.opponent_rank
        },
        venue: s.venue_name,
        broadcast: s.broadcast,
        status: s.status,
        statusDetail: s.status_detail,
        isFinal,
        isInProgress,
        isLocked,
        bettingLine: odds,
        score: {
          teamScore: s.team_score,
          opponentScore: s.opponent_score
        },
        userPick,
        userPrediction
      };
    });

    return res.json({
      team,
      schedule: scheduleList,
      totalGames: scheduleList.length
    });
  } catch (err) {
    console.error('Team schedule error:', err);
    return res.status(500).json({ error: 'Failed to retrieve team schedule' });
  }
});

module.exports = router;
