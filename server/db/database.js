const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const os = require('os');
const bcrypt = require('bcryptjs');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
const dataDir = isServerless ? os.tmpdir() : path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (e) {
    console.warn('Could not create data dir, using os.tmpdir():', e.message);
  }
}

const dbPath = path.join(dataDir, 'cfb_predictions.db');

// If in serverless and pre-bundled database exists in repository, copy it to /tmp on startup
const bundledDbPath = path.join(__dirname, '..', 'data', 'cfb_predictions.db');
if (isServerless && !fs.existsSync(dbPath) && fs.existsSync(bundledDbPath)) {
  try {
    fs.copyFileSync(bundledDbPath, dbPath);
    console.log('✓ Copied bundled database to serverless /tmp');
  } catch (e) {
    console.warn('Could not copy bundled db:', e.message);
  }
}

let db;
try {
  db = new Database(dbPath, { timeout: 7000 });
  if (isServerless) {
    db.pragma('journal_mode = MEMORY');
    db.pragma('temp_store = MEMORY');
    db.pragma('synchronous = OFF');
  } else {
    db.pragma('journal_mode = WAL');
  }
  db.pragma('foreign_keys = ON');
} catch (err) {
  console.warn('Fallback to in-memory SQLite database:', err.message);
  db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
}

// Initialize database schema
function initSchema() {
  const schema = `
    -- Users Table (Persistent accounts)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
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
      scoring_type TEXT DEFAULT 'STRAIGHT_UP',
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
      confidence_level INTEGER DEFAULT NULL,
      is_correct INTEGER DEFAULT NULL,
      points_awarded INTEGER DEFAULT 0,
      locked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, game_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Game Cache Table
    CREATE TABLE IF NOT EXISTS games_cache (
      game_id TEXT PRIMARY KEY,
      season_year INTEGER NOT NULL,
      week_number INTEGER NOT NULL,
      game_date DATETIME NOT NULL,
      status TEXT NOT NULL,
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

    -- Team Schedules Table (Official verified 2026 schedules)
    CREATE TABLE IF NOT EXISTS team_schedules (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      season_year INTEGER NOT NULL DEFAULT 2026,
      week_number INTEGER NOT NULL,
      game_date DATETIME NOT NULL,
      is_home INTEGER NOT NULL,
      opponent_name TEXT NOT NULL,
      opponent_logo TEXT,
      opponent_rank INTEGER,
      venue_name TEXT,
      broadcast TEXT,
      status TEXT DEFAULT 'STATUS_SCHEDULED',
      status_detail TEXT DEFAULT 'Scheduled',
      team_score INTEGER DEFAULT 0,
      opponent_score INTEGER DEFAULT 0,
      raw_json TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(team_id, week_number)
    );

    -- Party Chat & Trash Talk Table
    CREATE TABLE IF NOT EXISTS party_messages (
      id TEXT PRIMARY KEY,
      party_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'chat',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_team_sched_team ON team_schedules(team_id);
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

  // Auto-seed default demo users if empty
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get()?.count || 0;
    if (userCount === 0) {
      console.log('Seeding initial demo accounts...');
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync('password123', salt);

      const insertUser = db.prepare(`
        INSERT OR IGNORE INTO users (id, email, username, password_hash, display_name, favorite_team, avatar_url, jersey_number, total_points, correct_picks, total_picks, current_streak)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertUser.run('usr_coach_reed', 'josh@cfbpredictions.com', 'CoachReed', passwordHash, 'Josh "Coach" Reed', 'Georgia Bulldogs', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '48', 420, 38, 48, 5);
      insertUser.run('usr_sec_expert', 'sec.expert@cfb.com', 'SECGuru', passwordHash, 'Tyler "SEC Guru" Vance', 'Alabama Crimson Tide', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', '15', 380, 35, 48, 2);
      insertUser.run('usr_bigten_boss', 'buckeye.mike@cfb.com', 'BuckeyeMike', passwordHash, 'Mike "Buckeye" Miller', 'Ohio State Buckeyes', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', '7', 360, 33, 48, 0);

      // Create default public party
      db.prepare(`
        INSERT OR IGNORE INTO parties (id, name, description, invite_code, creator_id, conference_focus, scoring_type, icon)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run('pty_all_american', 'All-American National Pick\'em', 'Official nationwide prediction party across all FBS conferences.', 'ALLAM26', 'usr_coach_reed', 'ALL', 'STRAIGHT_UP', '🏆');

      // Enroll default members
      const insertMember = db.prepare(`INSERT OR IGNORE INTO party_members (id, party_id, user_id, role) VALUES (?, ?, ?, ?)`);
      insertMember.run('pm_1', 'pty_all_american', 'usr_coach_reed', 'creator');
      insertMember.run('pm_2', 'pty_all_american', 'usr_sec_expert', 'member');
      insertMember.run('pm_3', 'pty_all_american', 'usr_bigten_boss', 'member');
    }
  } catch (e) {
    console.warn('Auto-seed check warning:', e.message);
  }

  console.log('✅ SQLite schema initialized successfully.');
}

initSchema();

module.exports = db;
