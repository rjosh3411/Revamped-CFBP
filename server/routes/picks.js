const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/picks/my-picks
router.get('/my-picks', authenticateToken, (req, res) => {
  try {
    const year = parseInt(req.query.year || 2026, 10);
    const week = parseInt(req.query.week || 1, 10);

    const picks = db.prepare(`
      SELECT p.*, g.status as game_status, g.home_team_name, g.away_team_name, g.home_team_score, g.away_team_score, g.winner_team_id
      FROM picks p
      LEFT JOIN games_cache g ON p.game_id = g.game_id
      WHERE p.user_id = ? AND p.season_year = ? AND p.week_number = ?
    `).all(req.user.id, year, week);

    return res.json({ picks });
  } catch (err) {
    console.error('Fetch picks error:', err);
    return res.status(500).json({ error: 'Failed to fetch picks' });
  }
});

// POST /api/picks
router.post('/', authenticateToken, (req, res) => {
  try {
    const { gameId, seasonYear = 2026, weekNumber = 1, predictedWinnerId, predictedWinnerName, confidencePoints = 1, confidenceLevel = null } = req.body;

    if (!gameId || !predictedWinnerId || !predictedWinnerName) {
      return res.status(400).json({ error: 'gameId, predictedWinnerId, and predictedWinnerName are required' });
    }

    // Validate confidenceLevel if provided
    const safeConfidenceLevel = [1, 2, 3].includes(confidenceLevel) ? confidenceLevel : null;

    // Check if game has already started or is locked
    const game = db.prepare('SELECT * FROM games_cache WHERE game_id = ?').get(gameId);
    const teamSched = db.prepare('SELECT * FROM team_schedules WHERE game_id = ?').get(gameId);

    const gameDateStr = game?.game_date || teamSched?.game_date;
    const gameStatus = game?.status || teamSched?.status;
    const now = new Date();

    if (gameDateStr) {
      const gDate = new Date(gameDateStr);
      if (gDate <= now || gameStatus === 'STATUS_IN_PROGRESS' || gameStatus === 'STATUS_FINAL') {
        return res.status(400).json({
          error: '🔒 This game has already started or concluded. Predictions for this matchup are locked.'
        });
      }
    }

    let isCorrect = null;
    let pointsAwarded = 0;

    if (game && game.status === 'STATUS_FINAL' && game.winner_team_id) {
      isCorrect = (game.winner_team_id === predictedWinnerId) ? 1 : 0;
      pointsAwarded = isCorrect === 1 ? (confidencePoints * 10) : 0;
    }

    const pickId = 'pk_' + crypto.randomBytes(8).toString('hex');

    const upsertStmt = db.prepare(`
      INSERT INTO picks (
        id, user_id, game_id, season_year, week_number, predicted_winner_id, predicted_winner_name,
        confidence_points, confidence_level, is_correct, points_awarded, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
      )
      ON CONFLICT(user_id, game_id) DO UPDATE SET
        predicted_winner_id = excluded.predicted_winner_id,
        predicted_winner_name = excluded.predicted_winner_name,
        confidence_points = excluded.confidence_points,
        confidence_level = excluded.confidence_level,
        is_correct = excluded.is_correct,
        points_awarded = excluded.points_awarded,
        updated_at = CURRENT_TIMESTAMP
    `);

    upsertStmt.run(
      pickId,
      req.user.id,
      gameId,
      seasonYear,
      weekNumber,
      predictedWinnerId,
      predictedWinnerName,
      confidencePoints,
      safeConfidenceLevel,
      isCorrect,
      pointsAwarded
    );

    const savedPick = db.prepare('SELECT * FROM picks WHERE user_id = ? AND game_id = ?').get(req.user.id, gameId);

    // Update user stats
    const totalPicks = db.prepare('SELECT COUNT(*) as count FROM picks WHERE user_id = ?').get(req.user.id).count;
    const correctPicks = db.prepare('SELECT COUNT(*) as count FROM picks WHERE user_id = ? AND is_correct = 1').get(req.user.id).count;
    const totalPoints = db.prepare('SELECT SUM(points_awarded) as sum FROM picks WHERE user_id = ?').get(req.user.id).sum || 0;

    db.prepare('UPDATE users SET total_picks = ?, correct_picks = ?, total_points = ? WHERE id = ?').run(
      totalPicks,
      correctPicks,
      totalPoints,
      req.user.id
    );

    return res.json({ message: 'Pick saved successfully', pick: savedPick });
  } catch (err) {
    console.error('Save pick error:', err);
    return res.status(500).json({ error: 'Failed to save pick' });
  }
});

// POST /api/picks/bulk
router.post('/bulk', authenticateToken, (req, res) => {
  try {
    const { picks = [] } = req.body;
    if (!Array.isArray(picks) || picks.length === 0) {
      return res.status(400).json({ error: 'Array of picks required' });
    }

    const now = new Date();
    const upsertStmt = db.prepare(`
      INSERT INTO picks (
        id, user_id, game_id, season_year, week_number, predicted_winner_id, predicted_winner_name,
        confidence_points, is_correct, points_awarded, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
      )
      ON CONFLICT(user_id, game_id) DO UPDATE SET
        predicted_winner_id = excluded.predicted_winner_id,
        predicted_winner_name = excluded.predicted_winner_name,
        confidence_points = excluded.confidence_points,
        updated_at = CURRENT_TIMESTAMP
    `);

    const transaction = db.transaction((pickList) => {
      for (const p of pickList) {
        // Check lockout
        const game = db.prepare('SELECT * FROM games_cache WHERE game_id = ?').get(p.gameId);
        if (game?.game_date && new Date(game.game_date) <= now) {
          continue; // skip locked games
        }

        const pickId = 'pk_' + crypto.randomBytes(8).toString('hex');
        upsertStmt.run(
          pickId,
          req.user.id,
          p.gameId,
          p.seasonYear || 2026,
          p.weekNumber || 1,
          p.predictedWinnerId,
          p.predictedWinnerName,
          p.confidencePoints || 1,
          null,
          0
        );
      }
    });

    transaction(picks);

    return res.json({ message: `Processed picks` });
  } catch (err) {
    console.error('Bulk picks error:', err);
    return res.status(500).json({ error: 'Failed to save bulk picks' });
  }
});

module.exports = router;
