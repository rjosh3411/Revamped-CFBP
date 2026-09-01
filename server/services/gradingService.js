const db = require('../db/database');
const espnService = require('./espnService');

class GradingService {
  /**
   * Grade picks for a specific week or all completed games
   */
  async gradeWeekPicks(year = 2026, week = 1) {
    // 1. Fetch latest games from ESPN / DB
    const scoreboard = await espnService.getScoreboard({ year, week, forceRefresh: true });
    const games = scoreboard.games || [];

    const finalGames = games.filter(g => g.isFinal && g.winnerId);
    if (finalGames.length === 0) {
      return { gradedCount: 0, message: 'No final games found to grade yet.' };
    }

    const finalGameMap = new Map();
    finalGames.forEach(g => {
      finalGameMap.set(g.id, g.winnerId);
    });

    // 2. Fetch all pending picks for these games
    const gameIds = Array.from(finalGameMap.keys());
    const placeholders = gameIds.map(() => '?').join(',');

    const picksToGrade = db.prepare(`
      SELECT * FROM picks 
      WHERE game_id IN (${placeholders})
    `).all(...gameIds);

    const updatePickStmt = db.prepare(`
      UPDATE picks 
      SET is_correct = ?, points_awarded = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    let gradedCount = 0;
    const affectedUserIds = new Set();

    const transaction = db.transaction(() => {
      for (const pick of picksToGrade) {
        const winningTeamId = finalGameMap.get(pick.game_id);
        if (!winningTeamId) continue;

        const isCorrect = (pick.predicted_winner_id === winningTeamId) ? 1 : 0;
        const basePoints = (pick.confidence_points || 1) * 10;
        const pointsAwarded = isCorrect === 1 ? basePoints : 0;

        updatePickStmt.run(isCorrect, pointsAwarded, pick.id);
        affectedUserIds.add(pick.user_id);
        gradedCount++;
      }
    });

    transaction();

    // 3. Recalculate user statistics for affected users
    for (const userId of affectedUserIds) {
      this.recalculateUserStats(userId);
    }

    return {
      gradedCount,
      affectedUsers: affectedUserIds.size,
      finalGamesCount: finalGames.length
    };
  }

  /**
   * Recalculates total points, correct picks, and streaks for a user
   */
  recalculateUserStats(userId) {
    const picks = db.prepare(`
      SELECT p.*, g.game_date 
      FROM picks p
      LEFT JOIN games_cache g ON p.game_id = g.game_id
      WHERE p.user_id = ? AND p.is_correct IS NOT NULL
      ORDER BY g.game_date ASC, p.created_at ASC
    `).all(userId);

    const totalPicks = picks.length;
    const correctPicks = picks.filter(p => p.is_correct === 1).length;
    const totalPoints = picks.reduce((sum, p) => sum + (p.points_awarded || 0), 0);

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    for (const p of picks) {
      if (p.is_correct === 1) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }
    // Current streak is based on trailing picks
    currentStreak = tempStreak;

    db.prepare(`
      UPDATE users 
      SET total_points = ?, total_picks = ?, correct_picks = ?, current_streak = ?, best_streak = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(totalPoints, totalPicks, correctPicks, currentStreak, bestStreak, userId);
  }
}

module.exports = new GradingService();
