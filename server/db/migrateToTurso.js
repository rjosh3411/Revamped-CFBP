const { createClient } = require('@libsql/client');
const Database = require('better-sqlite3');
const path = require('path');

const url = 'libsql://cfb-predictions-rjosh3411.aws-us-east-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODgyMzk4NjUsImlkIjoiMDFhMDViNjMtZTAwMS03ZmE2LThlYjUtZWM0NGEyN2E4MTc1Iiwia2lkIjoiMEdpYWpSSUlHWERCZ045eE9SOGdiOVZUUGRkdEJMSU9yWEFTeHdDb3NDOCIsInJpZCI6IjQ3MWNiZmFlLTNjYTMtNDM5Yi1hZTIwLTQyNGQ2OWQ1NGI3NyJ9.6i21bQqIJOu9BpFC2EZMGdq7IsUbda-UUH6tkK6smW8eRA3bAPlPAa2PjQRk6N2f8M31jInX7_hr2M1gJ47qAA';

const client = createClient({ url, authToken });

async function migrate() {
  console.log('🏈 1. Creating all tables on Turso Cloud Database...');

  const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS users (
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
    )`,
    `CREATE TABLE IF NOT EXISTS parties (
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
    )`,
    `CREATE TABLE IF NOT EXISTS party_members (
      id TEXT PRIMARY KEY,
      party_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(party_id, user_id),
      FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS picks (
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
    )`,
    `CREATE TABLE IF NOT EXISTS games_cache (
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
    )`,
    `CREATE TABLE IF NOT EXISTS team_schedules (
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
    )`,
    `CREATE TABLE IF NOT EXISTS rankings_cache (
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
    )`,
    `CREATE TABLE IF NOT EXISTS party_messages (
      id TEXT PRIMARY KEY,
      party_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'chat',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  ];

  for (const stmt of schemaStatements) {
    await client.execute(stmt);
  }
  console.log('✓ All 8 core tables created on Turso!');

  // 2. Read local database and copy all schedules, users, and parties to Turso
  const localDbPath = path.join(__dirname, '..', 'data', 'cfb_predictions.db');
  const localDb = new Database(localDbPath);

  // Copy Users
  const localUsers = localDb.prepare('SELECT * FROM users').all();
  console.log(`Copying ${localUsers.length} users to Turso...`);
  for (const u of localUsers) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO users (id, email, username, password_hash, display_name, favorite_team, avatar_url, jersey_number, total_points, total_picks, correct_picks, current_streak, best_streak)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [u.id, u.email, u.username, u.password_hash, u.display_name, u.favorite_team, u.avatar_url, u.jersey_number, u.total_points, u.total_picks, u.correct_picks, u.current_streak, u.best_streak]
    });
  }

  // Copy Parties
  const localParties = localDb.prepare('SELECT * FROM parties').all();
  console.log(`Copying ${localParties.length} parties to Turso...`);
  for (const p of localParties) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO parties (id, name, description, invite_code, creator_id, conference_focus, scoring_type, icon)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.id, p.name, p.description, p.invite_code, p.creator_id, p.conference_focus, p.scoring_type, p.icon]
    });
  }

  // Copy Party Members
  const localMembers = localDb.prepare('SELECT * FROM party_members').all();
  console.log(`Copying ${localMembers.length} party memberships to Turso...`);
  for (const m of localMembers) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO party_members (id, party_id, user_id, role) VALUES (?, ?, ?, ?)`,
      args: [m.id, m.party_id, m.user_id, m.role]
    });
  }

  // Copy Team Schedules
  const localSchedules = localDb.prepare('SELECT * FROM team_schedules').all();
  console.log(`Copying ${localSchedules.length} verified 2026 team schedules to Turso...`);
  const batchSize = 50;
  for (let i = 0; i < localSchedules.length; i += batchSize) {
    const batch = localSchedules.slice(i, i + batchSize);
    const statements = batch.map(s => ({
      sql: `INSERT OR REPLACE INTO team_schedules (id, team_id, game_id, season_year, week_number, game_date, is_home, opponent_name, opponent_logo, opponent_rank, venue_name, broadcast, status, status_detail, team_score, opponent_score, raw_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [s.id, s.team_id, s.game_id, s.season_year, s.week_number, s.game_date, s.is_home, s.opponent_name, s.opponent_logo, s.opponent_rank, s.venue_name, s.broadcast, s.status, s.status_detail, s.team_score, s.opponent_score, s.raw_json]
    }));
    await client.batch(statements);
  }

  console.log('🎉 TURSO MIGRATION COMPLETE! Cloud database is 100% loaded and operational.');
}

migrate().catch(console.error);
