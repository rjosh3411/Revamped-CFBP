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
        WHERE user_id = ? AND (season_year = ? OR season_year = ?)
      `).all(req.user.id, year, String(year));

      for (const p of picks) {
        userPicksMap[p.game_id] = p;
      }
    }

    const gamesWithPicks = games.map(g => {
      const p = userPicksMap[g.id] || null;
      return {
        ...g,
        userPick: p ? {
          ...p,
          gameId: p.game_id,
          predictedWinnerId: p.predicted_winner_id,
          predictedWinnerName: p.predicted_winner_name,
          confidencePoints: p.confidence_points,
          confidenceLevel: p.confidence_level
        } : null
      };
    });

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

// GET /api/games/live-tracker (Real-time ESPN score stream & live updates)
router.get('/live-tracker', optionalAuth, async (req, res) => {
  try {
    const liveScoreboard = await espnService.getLiveScoreboard();
    const games = liveScoreboard.games || [];

    let userPicksMap = {};
    if (req.user) {
      const picks = await db.prepare(`
        SELECT * FROM picks 
        WHERE user_id = ? AND (season_year = 2026 OR season_year = '2026')
      `).all(req.user.id);

      for (const p of picks) {
        userPicksMap[p.game_id] = p;
      }
    }

    const gamesWithPicks = games.map(g => {
      const p = userPicksMap[g.id] || null;
      return {
        ...g,
        userPick: p ? {
          ...p,
          gameId: p.game_id,
          predictedWinnerId: p.predicted_winner_id,
          predictedWinnerName: p.predicted_winner_name,
          confidencePoints: p.confidence_points,
          confidenceLevel: p.confidence_level
        } : null
      };
    });

    return res.json({
      games: gamesWithPicks,
      total: gamesWithPicks.length,
      lastUpdated: liveScoreboard.lastUpdated,
      source: liveScoreboard.source
    });
  } catch (err) {
    console.error('Live tracker error:', err);
    return res.status(500).json({ error: 'Failed to fetch live scores' });
  }
});

module.exports = router;
