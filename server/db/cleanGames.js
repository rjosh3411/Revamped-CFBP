const db = require('./database');

function cleanAndDeduplicateGames() {
  console.log('🧹 Deduplicating and indexing 2026 games...');

  // Remove duplicate matchups for the same home, away, and week
  const rows = db.prepare(`
    SELECT game_id, week_number, home_team_name, away_team_name, game_date, rowid
    FROM games_cache
    ORDER BY week_number ASC, game_date ASC, rowid ASC
  `).all();

  const seenMatchups = new Set();
  const duplicateIds = [];

  for (const r of rows) {
    const key = `${r.week_number}_${(r.home_team_name || '').toLowerCase()}_${(r.away_team_name || '').toLowerCase()}`;
    if (seenMatchups.has(key)) {
      duplicateIds.push(r.game_id);
    } else {
      seenMatchups.add(key);
    }
  }

  if (duplicateIds.length > 0) {
    const placeholders = duplicateIds.map(() => '?').join(',');
    db.prepare(`DELETE FROM games_cache WHERE game_id IN (${placeholders})`).run(...duplicateIds);
    console.log(`✅ Removed ${duplicateIds.length} duplicate games.`);
  } else {
    console.log('✅ No duplicates found.');
  }

  const remaining = db.prepare('SELECT COUNT(*) as count FROM games_cache').get().count;
  console.log(`📊 Total clean 2026 games: ${remaining}`);
}

if (require.main === module) {
  cleanAndDeduplicateGames();
}

module.exports = cleanAndDeduplicateGames;
