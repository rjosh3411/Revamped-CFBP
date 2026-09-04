const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const gradingService = require('../services/gradingService');
const { authenticateToken } = require('../middleware/auth');

// GET /api/picks/my-picks
router.get('/my-picks', authenticateToken, async (req, res) => {
  try {
    const year = parseInt(req.query.year || 2026, 10);
    const week = parseInt(req.query.week || 1, 10);

    // Auto-sync any concluded games before returning picks
    await gradingService.syncAndGradeLiveScores().catch(e => console.warn('Picks grading warning:', e));

    const picks = await db.prepare(`
      SELECT p.*, g.status as game_status, g.home_team_name, g.away_team_name, g.home_team_score, g.away_team_score, g.winner_team_id
      FROM picks p
      LEFT JOIN games_cache g ON p.game_id = g.game_id
      WHERE p.user_id = ? AND (p.season_year = ? OR p.season_year = ?) AND p.week_number = ?
    `).all(req.user.id, year, String(year), week);

    return res.json({ picks });
  } catch (err) {
    console.error('Fetch picks error:', err);
    return res.status(500).json({ error: 'Failed to fetch picks' });
  }
});

// GET /api/picks/my-stats
router.get('/my-stats', authenticateToken, async (req, res) => {
  try {
    const year = parseInt(req.query.year || 2026, 10);
    const userId = req.user.id;

    // Auto-sync any concluded games before returning latest statistics
    await gradingService.syncAndGradeLiveScores().catch(e => console.warn('Stats grading warning:', e));

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    const picks = await db.prepare(`
      SELECT p.*, g.status as game_status, g.home_team_name, g.away_team_name, g.winner_team_id, g.game_date
      FROM picks p
      LEFT JOIN games_cache g ON p.game_id = g.game_id
      WHERE p.user_id = ? AND (p.season_year = ? OR p.season_year = ?)
      ORDER BY p.week_number ASC, g.game_date ASC, p.created_at ASC
    `).all(userId, year, String(year));

    const gradedPicks = picks.filter(p => p.is_correct !== null);
    const correctCount = gradedPicks.filter(p => p.is_correct === 1).length;
    const lossCount = gradedPicks.filter(p => p.is_correct === 0).length;
    const pendingCount = picks.filter(p => p.is_correct === null).length;
    const totalGraded = gradedPicks.length;
    const winPercentage = totalGraded > 0 ? ((correctCount / totalGraded) * 100).toFixed(1) : '0.0';
    const totalPoints = picks.reduce((sum, p) => sum + (p.points_awarded || 0), 0);

    // Calculate streaks
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    for (const p of gradedPicks) {
      if (p.is_correct === 1) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }
    currentStreak = tempStreak;

    // Confidence / Star accuracy breakdown
    const getStarStats = (starLevel) => {
      const starGraded = gradedPicks.filter(p => p.confidence_level === starLevel || p.confidence_points === starLevel);
      const starCorrect = starGraded.filter(p => p.is_correct === 1).length;
      const starTotal = starGraded.length;
      const acc = starTotal > 0 ? ((starCorrect / starTotal) * 100).toFixed(0) : null;
      return { total: starTotal, correct: starCorrect, losses: starTotal - starCorrect, accuracy: acc };
    };

    const lockStats = getStarStats(3); // 3-Star Locks
    const mediumStats = getStarStats(2); // 2-Star
    const regularStats = getStarStats(1); // 1-Star

    // Week by week summary
    const weekMap = {};
    for (const p of picks) {
      const w = p.week_number || 1;
      if (!weekMap[w]) {
        weekMap[w] = { week: w, totalPicks: 0, graded: 0, correct: 0, losses: 0, pending: 0, points: 0 };
      }
      weekMap[w].totalPicks++;
      if (p.is_correct === 1) {
        weekMap[w].graded++;
        weekMap[w].correct++;
        weekMap[w].points += (p.points_awarded || 0);
      } else if (p.is_correct === 0) {
        weekMap[w].graded++;
        weekMap[w].losses++;
      } else {
        weekMap[w].pending++;
      }
    }

    const weeks = Object.values(weekMap).map(w => ({
      ...w,
      winPercentage: w.graded > 0 ? ((w.correct / w.graded) * 100).toFixed(1) : '0.0'
    }));

    return res.json({
      user: {
        id: user?.id,
        displayName: user?.display_name || user?.username,
        favoriteTeam: user?.favorite_team,
        jerseyNumber: user?.jersey_number
      },
      stats: {
        totalPicks: picks.length,
        totalGraded,
        wins: correctCount,
        losses: lossCount,
        pending: pendingCount,
        winPercentage: parseFloat(winPercentage),
        totalPoints,
        currentStreak: user?.current_streak !== undefined ? user.current_streak : currentStreak,
        bestStreak: user?.best_streak !== undefined ? user.best_streak : bestStreak,
        lockStats,
        mediumStats,
        regularStats,
        weeks
      }
    });
  } catch (err) {
    console.error('Fetch stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});


// POST /api/picks
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { gameId, seasonYear = 2026, weekNumber = 1, predictedWinnerId, predictedWinnerName, confidencePoints = 1, confidenceLevel = null } = req.body;

    if (!gameId || !predictedWinnerId || !predictedWinnerName) {
      return res.status(400).json({ error: 'gameId, predictedWinnerId, and predictedWinnerName are required' });
    }

    const safeConfidenceLevel = [1, 2, 3].includes(confidenceLevel) ? confidenceLevel : null;

    // Check lockout
    const game = await db.prepare('SELECT * FROM games_cache WHERE game_id = ?').get(gameId);
    const teamSched = await db.prepare('SELECT * FROM team_schedules WHERE game_id = ?').get(gameId);

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

    await upsertStmt.run(
      pickId,
      req.user.id,
      gameId,
      parseInt(seasonYear, 10) || 2026,
      parseInt(weekNumber, 10) || 1,
      predictedWinnerId,
      predictedWinnerName,
      confidencePoints,
      safeConfidenceLevel,
      isCorrect,
      pointsAwarded
    );

    const savedPick = await db.prepare('SELECT * FROM picks WHERE user_id = ? AND game_id = ?').get(req.user.id, gameId);

    // Update user stats
    const totalPicksRes = await db.prepare('SELECT COUNT(*) as count FROM picks WHERE user_id = ?').get(req.user.id);
    const correctPicksRes = await db.prepare('SELECT COUNT(*) as count FROM picks WHERE user_id = ? AND is_correct = 1').get(req.user.id);
    const totalPointsRes = await db.prepare('SELECT SUM(points_awarded) as sum FROM picks WHERE user_id = ?').get(req.user.id);

    const totalPicks = totalPicksRes?.count || 0;
    const correctPicks = correctPicksRes?.count || 0;
    const totalPoints = totalPointsRes?.sum || 0;

    await db.prepare('UPDATE users SET total_picks = ?, correct_picks = ?, total_points = ? WHERE id = ?').run(
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
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const { picks = [] } = req.body;
    if (!Array.isArray(picks) || picks.length === 0) {
      return res.status(400).json({ error: 'Array of picks required' });
    }

    const now = new Date();
    for (const p of picks) {
      const game = await db.prepare('SELECT * FROM games_cache WHERE game_id = ?').get(p.gameId);
      if (game?.game_date && new Date(game.game_date) <= now) {
        continue;
      }

      const pickId = 'pk_' + crypto.randomBytes(8).toString('hex');
      await db.prepare(`
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
      `).run(
        pickId,
        req.user.id,
        p.gameId,
        parseInt(p.seasonYear, 10) || 2026,
        parseInt(p.weekNumber, 10) || 1,
        p.predictedWinnerId,
        p.predictedWinnerName,
        p.confidencePoints || 1,
        null,
        0
      );
    }

    return res.json({ message: `Processed picks` });
  } catch (err) {
    console.error('Bulk picks error:', err);
    return res.status(500).json({ error: 'Failed to save bulk picks' });
  }
});

module.exports = router;
