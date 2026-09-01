const express = require('express');
const router = express.Router();
const espnService = require('../services/espnService');
const gradingService = require('../services/gradingService');
const { optionalAuth } = require('../middleware/auth');
const db = require('../db/database');

// GET /api/games
router.get('/', optionalAuth, async (req, res) => {
  try {
    const year = parseInt(req.query.year || 2026, 10);
    const week = parseInt(req.query.week || 1, 10);
    const seasonType = parseInt(req.query.seasonType || 2, 10);
    const conference = (req.query.conference || 'ALL').toUpperCase();
    const forceRefresh = req.query.refresh === 'true';

    const scoreboard = await espnService.getScoreboard({
      year,
      week,
      seasonType,
      conference,
      forceRefresh
    });

    let games = scoreboard.games || [];

    // Filter by conference if not handled by endpoint group
    if (conference === 'TOP25') {
      games = games.filter(g => (g.homeTeam.rank !== null && g.homeTeam.rank <= 25) || (g.awayTeam.rank !== null && g.awayTeam.rank <= 25));
    }

    // Attach current user's picks if logged in
    let userPicksMap = {};
    if (req.user) {
      const picks = db.prepare(`
        SELECT * FROM picks 
        WHERE user_id = ? AND season_year = ? AND week_number = ?
      `).all(req.user.id, year, week);

      for (const p of picks) {
        userPicksMap[p.game_id] = p;
      }
    }

    const gamesWithPicks = games.map(g => ({
      ...g,
      userPick: userPicksMap[g.id] || null
    }));

    return res.json({
      season: scoreboard.season,
      week: scoreboard.week,
      conference,
      games: gamesWithPicks,
      total: gamesWithPicks.length,
      fromLiveEspn: scoreboard.fromLiveEspn,
      warning: scoreboard.warning
    });
  } catch (err) {
    console.error('Games fetch error:', err);
    return res.status(500).json({ error: 'Failed to retrieve college football games' });
  }
});

// POST /api/games/sync
router.post('/sync', async (req, res) => {
  try {
    const year = parseInt(req.body.year || 2026, 10);
    const week = parseInt(req.body.week || 1, 10);

    // Refresh ESPN games and grade picks
    const gradeResult = await gradingService.gradeWeekPicks(year, week);

    return res.json({
      message: 'ESPN synchronization and pick grading completed',
      result: gradeResult
    });
  } catch (err) {
    console.error('Sync error:', err);
    return res.status(500).json({ error: 'Failed to sync with ESPN' });
  }
});

module.exports = router;
