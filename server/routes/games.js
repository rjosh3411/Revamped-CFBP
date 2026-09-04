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
    const week = req.query.week !== undefined ? parseInt(req.query.week, 10) : 0;
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

    if (conference && conference !== 'ALL') {
      games = espnService.filterByConference(games, conference);
    }

    let userPicksMap = {};
    if (req.user) {
      const picks = await db.prepare(`
        SELECT * FROM picks 
        WHERE user_id = ? AND (season_year = ? OR season_year = ?) AND week_number = ?
      `).all(req.user.id, year, String(year), week);

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
    return res.status(500).json({ error: 'Failed to fetch college football games' });
  }
});

// POST /api/games/grade (Trigger grading for completed games)
router.post('/grade', async (req, res) => {
  try {
    const year = parseInt(req.body.year || 2026, 10);
    const week = parseInt(req.body.week || 1, 10);

    const result = await gradingService.gradeCompletedGames(year, week);
    return res.json({ message: 'Grading complete', ...result });
  } catch (err) {
    console.error('Grading trigger error:', err);
    return res.status(500).json({ error: 'Failed to grade predictions' });
  }
});

module.exports = router;
