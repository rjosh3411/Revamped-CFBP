const express = require('express');
const router = express.Router();
const db = require('../db/database');
const espnService = require('../services/espnService');
const { authenticateToken } = require('../middleware/auth');

// GET /api/comparison/party/:partyId
router.get('/party/:partyId', authenticateToken, async (req, res) => {
  try {
    const partyId = req.params.partyId;
    const year = parseInt(req.query.year || 2026, 10);
    const week = parseInt(req.query.week || 1, 10);
    const buddyId = req.query.buddyId;

    // Check party membership
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

    let selectedBuddy = null;
    if (buddyId) {
      selectedBuddy = buddies.find(b => b.id === buddyId) || null;
    }
    if (!selectedBuddy && buddies.length > 0) {
      selectedBuddy = buddies[0];
    }

    // Fetch games for the week
    const scoreboard = await espnService.getScoreboard({ year, week });
    const games = scoreboard.games || [];

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

    const gameComparisons = games.map(g => {
      const myPick = myPicksMap.get(g.id) || null;
      const buddyPick = selectedBuddy ? (buddyPicksMap.get(g.id) || null) : null;
      const allPicksForGame = partyPicksByGame.get(g.id) || [];

      let comparisonStatus = 'UNPICKED';
      let headToHeadResult = 'PENDING';

      if (myPick && buddyPick) {
        totalCompared++;
        if (myPick.predicted_winner_id === buddyPick.predicted_winner_id) {
          comparisonStatus = 'AGREED';
          agreedCount++;
        } else {
          comparisonStatus = 'DISAGREED';
          disagreedCount++;
        }

        if (g.isFinal && g.winnerId) {
          const myCorrect = myPick.predicted_winner_id === g.winnerId;
          const buddyCorrect = buddyPick.predicted_winner_id === g.winnerId;

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

      const homePicksCount = allPicksForGame.filter(p => p.predicted_winner_id === g.homeTeam.id).length;
      const awayPicksCount = allPicksForGame.filter(p => p.predicted_winner_id === g.awayTeam.id).length;
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
        totalGames: games.length,
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
