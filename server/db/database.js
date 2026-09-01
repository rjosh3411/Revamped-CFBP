const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'cfb_predictions.db');
const db = new Database(dbPath);

// Enable WAL mode and foreign keys for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database schema
function initSchema() {
  const schema = `
    -- Users Table (Persistent accounts)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      favorite_team TEXT DEFAULT 'Georgia Bulldogs',
      avatar_url TEXT DEFAULT '',
      jersey_number TEXT DEFAULT '7',
      total_points INTEGER DEFAULT 0,
      total_picks INTEGER DEFAULT 0,
      correct_picks INTEGER DEFAULT 0,
      current_streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Prediction Parties Table
    CREATE TABLE IF NOT EXISTS parties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      invite_code TEXT UNIQUE NOT NULL,
      creator_id TEXT NOT NULL,
      conference_focus TEXT DEFAULT 'ALL',
      scoring_type TEXT DEFAULT 'STRAIGHT_UP', -- 'STRAIGHT_UP', 'ATS', 'OVER_UNDER', 'CONFIDENCE'
      icon TEXT DEFAULT '🏈',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Party Memberships Table
    CREATE TABLE IF NOT EXISTS party_members (
      id TEXT PRIMARY KEY,
      party_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(party_id, user_id),
      FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Weekly Game Predictions Table
    CREATE TABLE IF NOT EXISTS picks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      season_year INTEGER NOT NULL,
      week_number INTEGER NOT NULL,
      predicted_winner_id TEXT NOT NULL,
      predicted_winner_name TEXT NOT NULL,
      confidence_points INTEGER DEFAULT 1,
      is_correct INTEGER DEFAULT NULL, -- NULL = pending, 1 = correct, 0 = incorrect
      points_awarded INTEGER DEFAULT 0,
      locked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, game_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Game Cache Table (Cached ESPN games and status)
    CREATE TABLE IF NOT EXISTS games_cache (
      game_id TEXT PRIMARY KEY,
      season_year INTEGER NOT NULL,
      week_number INTEGER NOT NULL,
      game_date DATETIME NOT NULL,
      status TEXT NOT NULL, -- 'STATUS_SCHEDULED', 'STATUS_IN_PROGRESS', 'STATUS_FINAL'
      status_detail TEXT NOT NULL,
      home_team_id TEXT NOT NULL,
      home_team_name TEXT NOT NULL,
      home_team_rank INTEGER,
      home_team_logo TEXT,
      home_team_score INTEGER DEFAULT 0,
      away_team_id TEXT NOT NULL,
      away_team_name TEXT NOT NULL,
      away_team_rank INTEGER,
      away_team_logo TEXT,
      away_team_score INTEGER DEFAULT 0,
      winner_team_id TEXT,
      conference_competition INTEGER DEFAULT 0,
      venue_name TEXT,
      broadcast TEXT,
      raw_json TEXT,
      last_synced DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- AP Top 25 and Poll Rankings Cache
    CREATE TABLE IF NOT EXISTS rankings_cache (
      poll_name TEXT NOT NULL,
      rank INTEGER NOT NULL,
      team_id TEXT NOT NULL,
      team_name TEXT NOT NULL,
      team_nickname TEXT,
      logo_url TEXT,
      record TEXT,
      points INTEGER,
      previous_rank INTEGER,
      rank_change TEXT,
      headline TEXT,
      season_year INTEGER,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (poll_name, rank)
    );

    -- Party Chat & Trash Talk Table
    CREATE TABLE IF NOT EXISTS party_messages (
      id TEXT PRIMARY KEY,
      party_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'chat', -- 'chat', 'pick_alert', 'system'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_picks_user_week ON picks(user_id, season_year, week_number);
    CREATE INDEX IF NOT EXISTS idx_picks_game ON picks(game_id);
    CREATE INDEX IF NOT EXISTS idx_party_members_user ON party_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_party_members_party ON party_members(party_id);
    CREATE INDEX IF NOT EXISTS idx_games_week ON games_cache(season_year, week_number);
    CREATE INDEX IF NOT EXISTS idx_parties_code ON parties(invite_code);
  `;

  db.exec(schema);

  // Run migrations safely
  try {
    db.exec("ALTER TABLE parties ADD COLUMN scoring_type TEXT DEFAULT 'STRAIGHT_UP'");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE users ADD COLUMN jersey_number TEXT DEFAULT '7'");
  } catch (e) {}

  try {
    db.exec("ALTER TABLE picks ADD COLUMN confidence_level INTEGER DEFAULT NULL");
  } catch (e) {}

  console.log('✅ SQLite schema initialized successfully in WAL mode.');
}

initSchema();

module.exports = db;
