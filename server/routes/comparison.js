const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { TEAMS_2026 } = require('../db/teamsData');
const { calculateBettingLine } = require('../services/oddsService');
const { authenticateToken } = require('../middleware/auth');

// GET /api/comparison/party/:partyId
router.get('/party/:partyId', authenticateToken, async (req, res) => {
  try {
    const partyId = req.params.partyId;
    const year = parseInt(req.query.year || 2026, 10);
    const week = parseInt(req.query.week || 1, 10);
    const buddyId = req.query.buddyId;

    // Check party membership & details
    const party = await db.prepare('SELECT * FROM parties WHERE id = ?').get(partyId);
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }

    const isMember = await db.prepare('SELECT id FROM party_members WHERE party_id = ? AND user_id = ?').get(partyId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this party' });
    }

    // Get all party members
    const members = await db.prepare(`
      SELECT u.id, u.username, u.display_name, u.favorite_team, u.avatar_url,
             u.total_points, u.correct_picks, u.total_picks, u.current_streak,
             pm.role,
             (SELECT COUNT(*) FROM picks WHERE user_id = u.id AND confidence_level = 3 AND is_correct = 1) as high_conf_correct,
             (SELECT COUNT(*) FROM picks WHERE user_id = u.id AND confidence_level = 3 AND is_correct IS NOT NULL) as high_conf_total,
             (SELECT COUNT(*) FROM picks WHERE user_id = u.id AND confidence_level = 2 AND is_correct = 1) as med_conf_correct,
             (SELECT COUNT(*) FROM picks WHERE user_id = u.id AND confidence_level = 2 AND is_correct IS NOT NULL) as med_conf_total,
             (SELECT COUNT(*) FROM picks WHERE user_id = u.id AND confidence_level = 1 AND is_correct = 1) as low_conf_correct,
             (SELECT COUNT(*) FROM picks WHERE user_id = u.id AND confidence_level = 1 AND is_correct IS NOT NULL) as low_conf_total
      FROM party_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.party_id = ?
      ORDER BY u.display_name ASC
    `).all(partyId);

    const buddies = members.filter(m => m.id !== req.user.id);

    // If alone in party (no other buddies), return empty comparisons with party metadata
    if (buddies.length === 0) {
      return res.json({
        partyId,
        party,
        year,
        week,
        currentUser: {
          id: req.user.id,
          displayName: req.user.display_name,
          avatarUrl: req.user.avatar_url,
          favoriteTeam: req.user.favorite_team,
          weeklyPoints: 0
        },
        buddies: [],
        selectedBuddy: null,
        summary: {
          totalGames: 0,
          totalCompared: 0,
          agreedCount: 0,
          disagreedCount: 0,
          agreementRate: 0,
          myWeeklyPoints: 0,
          buddyWeeklyPoints: 0,
          pointDifferential: 0
        },
        comparisons: []
      });
    }

    let selectedBuddy = null;
    if (buddyId) {
      selectedBuddy = buddies.find(b => b.id === buddyId) || null;
    }
    if (!selectedBuddy && buddies.length > 0) {
      selectedBuddy = buddies[0];
    }

    // Fetch verified 2026 schedules for this week
    const weekSchedules = await db.prepare(`
      SELECT * FROM team_schedules 
      WHERE (season_year = 2026 OR season_year = '2026') AND week_number = ?
      ORDER BY game_date ASC
    `).all(week);

    // Group schedules by game_id to construct complete 2026 matchups
    const gamesMap = new Map();
    for (const s of weekSchedules) {
      if (!gamesMap.has(s.game_id)) {
        const teamObj = TEAMS_2026.find(t => t.id === s.team_id) || {
          id: s.team_id,
          name: s.team_id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          logoUrl: `https://a.espncdn.com/i/teamlogos/ncaa/500/${s.team_id}.png`,
          ranking: null,
          colors: { primary: '#1e3a8a' }
        };

        const oppObj = TEAMS_2026.find(t => t.name.toLowerCase() === s.opponent_name.toLowerCase() || t.id === s.opponent_name.toLowerCase().replace(/\s+/g, '-')) || {
          id: s.opponent_name.toLowerCase().replace(/\s+/g, '-'),
          name: s.opponent_name,
          logoUrl: s.opponent_logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/7.png`,
          ranking: s.opponent_rank || null,
          colors: { primary: '#991b1b' }
        };

        const homeTeam = s.is_home === 1 ? {
          id: teamObj.id,
          name: teamObj.name,
          logo: teamObj.logoUrl,
          rank: teamObj.ranking,
          score: s.team_score || 0
        } : {
          id: oppObj.id,
          name: oppObj.name,
          logo: oppObj.logoUrl,
          rank: oppObj.ranking,
          score: s.opponent_score || 0
        };

        const awayTeam = s.is_home === 1 ? {
          id: oppObj.id,
          name: oppObj.name,
          logo: oppObj.logoUrl,
          rank: oppObj.ranking,
          score: s.opponent_score || 0
        } : {
          id: teamObj.id,
          name: teamObj.name,
          logo: teamObj.logoUrl,
          rank: teamObj.ranking,
          score: s.team_score || 0
        };

        const odds = calculateBettingLine({
          homeTeamName: homeTeam.name,
          homeRank: homeTeam.rank,
          awayTeamName: awayTeam.name,
          awayRank: awayTeam.rank,
          isHome: true
        });

        gamesMap.set(s.game_id, {
          id: s.game_id,
          seasonYear: year,
          weekNumber: week,
          date: s.game_date,
          name: `${awayTeam.name} at ${homeTeam.name}`,
          shortName: `${awayTeam.name} @ ${homeTeam.name}`,
          status: s.status,
          statusDetail: s.status_detail,
          isFinal: s.status === 'STATUS_FINAL',
          isInProgress: s.status === 'STATUS_IN_PROGRESS',
          winnerId: null,
          broadcast: s.broadcast || 'ESPN',
          venue: s.venue_name || 'College Stadium',
          odds,
          homeTeam,
          awayTeam
        });
      }
    }

    const allWeekGames = Array.from(gamesMap.values());

    // Fetch current user picks
    const myPicks = await db.prepare(`
      SELECT * FROM picks 
      WHERE user_id = ? AND (season_year = ? OR season_year = ?) AND week_number = ?
    `).all(req.user.id, year, String(year), week);

    const myPicksMap = new Map();
    myPicks.forEach(p => myPicksMap.set(p.game_id, p));

    // Fetch buddy picks if buddy exists
    const buddyPicksMap = new Map();
    if (selectedBuddy) {
      const buddyPicks = await db.prepare(`
        SELECT * FROM picks 
        WHERE user_id = ? AND (season_year = ? OR season_year = ?) AND week_number = ?
      `).all(selectedBuddy.id, year, String(year), week);
      buddyPicks.forEach(p => buddyPicksMap.set(p.game_id, p));
    }

    // Fetch all party members' picks for party consensus
    const allPartyPicks = await db.prepare(`
      SELECT p.*, u.display_name, u.avatar_url
      FROM picks p
      JOIN party_members pm ON p.user_id = pm.user_id
      JOIN users u ON p.user_id = u.id
      WHERE pm.party_id = ? AND (p.season_year = ? OR p.season_year = ?) AND p.week_number = ?
    `).all(partyId, year, String(year), week);

    const partyPicksByGame = new Map();
    allPartyPicks.forEach(p => {
      if (!partyPicksByGame.has(p.game_id)) {
        partyPicksByGame.set(p.game_id, []);
      }
      partyPicksByGame.get(p.game_id).push(p);
    });

    let totalCompared = 0;
    let agreedCount = 0;
    let disagreedCount = 0;
    let myWeeklyPoints = 0;
    let buddyWeeklyPoints = 0;

    // Filter games to either games that have picks by party members OR all scheduled 2026 games
    const gamesWithPicks = allWeekGames.filter(g => {
      return myPicksMap.has(g.id) || (selectedBuddy && buddyPicksMap.has(g.id)) || partyPicksByGame.has(g.id);
    });

    // If no picks made yet, show top scheduled games for the week
    const targetGames = gamesWithPicks.length > 0 ? gamesWithPicks : allWeekGames.slice(0, 15);

function cleanStr(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function resolvePickToTeam(pick, homeTeam, awayTeam) {
  if (!pick) return null;
  const pId = String(pick.predicted_winner_id || '').toLowerCase().trim();
  const pName = String(pick.predicted_winner_name || '').toLowerCase().trim();
  const pClean = cleanStr(pName || pId);

  const hId = String(homeTeam?.id || '').toLowerCase().trim();
  const hName = String(homeTeam?.name || '').toLowerCase().trim();
  const hAbbr = String(homeTeam?.abbreviation || '').toLowerCase().trim();
  const hClean = cleanStr(hName);

  const aId = String(awayTeam?.id || '').toLowerCase().trim();
  const aName = String(awayTeam?.name || '').toLowerCase().trim();
  const aAbbr = String(awayTeam?.abbreviation || '').toLowerCase().trim();
  const aClean = cleanStr(aName);

  // Exact ID match
  if (pId && (pId === hId || (homeTeam?.espnId && pId === String(homeTeam.espnId)))) return 'HOME';
  if (pId && (pId === aId || (awayTeam?.espnId && pId === String(awayTeam.espnId)))) return 'AWAY';

  // Name or abbreviation matching on home
  if (pClean && hClean && (pClean === hClean || pClean.includes(hClean) || hClean.includes(pClean) || pClean === cleanStr(hAbbr) || pClean === cleanStr(hId))) return 'HOME';
  
  // Name or abbreviation matching on away
  if (pClean && aClean && (pClean === aClean || pClean.includes(aClean) || aClean.includes(pClean) || pClean === cleanStr(aAbbr) || pClean === cleanStr(aId))) return 'AWAY';

  return pClean;
}

    const gameComparisons = targetGames.map(g => {
      const myPick = myPicksMap.get(g.id) || null;
      const buddyPick = selectedBuddy ? (buddyPicksMap.get(g.id) || null) : null;
      const allPicksForGame = partyPicksByGame.get(g.id) || [];

      let comparisonStatus = 'UNPICKED';
      let headToHeadResult = 'PENDING';

      if (myPick && buddyPick) {
        totalCompared++;
        const myTeamSide = resolvePickToTeam(myPick, g.homeTeam, g.awayTeam);
        const buddyTeamSide = resolvePickToTeam(buddyPick, g.homeTeam, g.awayTeam);

        if (myTeamSide && buddyTeamSide && myTeamSide === buddyTeamSide) {
          comparisonStatus = 'AGREED';
          agreedCount++;
        } else {
          comparisonStatus = 'DISAGREED';
          disagreedCount++;
        }

        if (g.isFinal && g.winnerId) {
          const myCorrect = myPick.predicted_winner_id === g.winnerId || myPick.is_correct === 1;
          const buddyCorrect = buddyPick.predicted_winner_id === g.winnerId || buddyPick.is_correct === 1;

          if (myCorrect && buddyCorrect) headToHeadResult = 'BOTH_CORRECT';
          else if (!myCorrect && !buddyCorrect) headToHeadResult = 'BOTH_INCORRECT';
          else if (myCorrect && !buddyCorrect) headToHeadResult = 'YOU_WON';
          else if (!myCorrect && buddyCorrect) headToHeadResult = 'BUDDY_WON';
        }
      } else if (myPick) {
        comparisonStatus = 'MY_ONLY';
      } else if (buddyPick) {
        comparisonStatus = 'BUDDY_ONLY';
      }

      if (myPick && myPick.points_awarded) {
        myWeeklyPoints += myPick.points_awarded;
      }
      if (buddyPick && buddyPick.points_awarded) {
        buddyWeeklyPoints += buddyPick.points_awarded;
      }

      const homePicksCount = allPicksForGame.filter(p => {
        return resolvePickToTeam(p, g.homeTeam, g.awayTeam) === 'HOME';
      }).length;

      const awayPicksCount = allPicksForGame.filter(p => {
        return resolvePickToTeam(p, g.homeTeam, g.awayTeam) === 'AWAY';
      }).length;

      const totalPartyPicks = homePicksCount + awayPicksCount;

      const consensus = {
        totalPicks: totalPartyPicks,
        homePct: totalPartyPicks > 0 ? Math.round((homePicksCount / totalPartyPicks) * 100) : 50,
        awayPct: totalPartyPicks > 0 ? Math.round((awayPicksCount / totalPartyPicks) * 100) : 50,
        consensusTeam: homePicksCount > awayPicksCount ? g.homeTeam.name : (awayPicksCount > homePicksCount ? g.awayTeam.name : 'Split 50/50')
      };

      return {
        game: g,
        myPick,
        buddyPick,
        comparisonStatus,
        headToHeadResult,
        consensus,
        partyPicksCount: allPicksForGame.length,
        partyPicksList: allPicksForGame.map(p => ({
          userId: p.user_id,
          userName: p.display_name,
          predictedId: p.predicted_winner_id,
          predictedName: p.predicted_winner_name,
          isCorrect: p.is_correct
        }))
      };
    });

    const agreementRate = totalCompared > 0 ? Math.round((agreedCount / totalCompared) * 100) : 0;

    return res.json({
      partyId,
      party,
      year,
      week,
      currentUser: {
        id: req.user.id,
        displayName: req.user.display_name,
        avatarUrl: req.user.avatar_url,
        favoriteTeam: req.user.favorite_team,
        weeklyPoints: myWeeklyPoints
      },
      buddies,
      selectedBuddy: selectedBuddy ? {
        id: selectedBuddy.id,
        displayName: selectedBuddy.display_name,
        avatarUrl: selectedBuddy.avatar_url,
        favoriteTeam: selectedBuddy.favorite_team,
        weeklyPoints: buddyWeeklyPoints
      } : null,
      summary: {
        totalGames: targetGames.length,
        totalCompared,
        agreedCount,
        disagreedCount,
        agreementRate,
        myWeeklyPoints,
        buddyWeeklyPoints,
        pointDifferential: myWeeklyPoints - buddyWeeklyPoints
      },
      comparisons: gameComparisons
    });
  } catch (err) {
    console.error('Buddy comparison error:', err);
    return res.status(500).json({ error: 'Failed to generate buddy comparison matrix' });
  }
});

module.exports = router;
