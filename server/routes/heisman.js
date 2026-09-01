const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { optionalAuth, authenticateToken } = require('../middleware/auth');

// Add awards table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS awards_picks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    season_year INTEGER NOT NULL,
    heisman_winner_id TEXT,
    heisman_winner_name TEXT,
    heisman_winner_school TEXT,
    heisman_winner_logo TEXT,
    cfp_champion_id TEXT,
    cfp_champion_name TEXT,
    cfp_runner_up_id TEXT,
    cfp_runner_up_name TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, season_year),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

const HEISMAN_CANDIDATES = [
  { id: 'arch_manning', name: 'Arch Manning', position: 'QB', school: 'Texas', logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/251.png' },
  { id: 'jeremiah_smith', name: 'Jeremiah Smith', position: 'WR', school: 'Ohio State', logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/194.png' },
  { id: 'dante_moore', name: 'Dante Moore', position: 'QB', school: 'Oregon', logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2483.png' },
  { id: 'cj_carr', name: 'CJ Carr', position: 'QB', school: 'Notre Dame', logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/87.png' },
  { id: 'darian_mensah', name: 'Darian Mensah', position: 'QB', school: 'Miami', logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2390.png' },
  { id: 'gunner_stockton', name: 'Gunner Stockton', position: 'QB', school: 'Georgia', logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/61.png' },
  { id: 'julian_sayin', name: 'Julian Sayin', position: 'QB', school: 'Ohio State', logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/194.png' },
  { id: 'trinidad_chambliss', name: 'Trinidad Chambliss', position: 'QB', school: 'Ole Miss', logoUrl: 'https://a.espncdn.com/i/teamlogos/ncaa/500/145.png' }
];

// GET /api/heisman
router.get('/', optionalAuth, (req, res) => {
  try {
    const year = parseInt(req.query.year || 2026, 10);
    let myPick = null;

    if (req.user) {
      myPick = db.prepare('SELECT * FROM awards_picks WHERE user_id = ? AND season_year = ?').get(req.user.id, year) || null;
    }

    return res.json({
      candidates: HEISMAN_CANDIDATES,
      myPick
    });
  } catch (err) {
    console.error('Heisman fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch Heisman candidates' });
  }
});

// POST /api/heisman
router.post('/', authenticateToken, (req, res) => {
  try {
    const { seasonYear = 2026, heismanWinnerId, cfpChampionName } = req.body;
    const candidate = HEISMAN_CANDIDATES.find(c => c.id === heismanWinnerId);

    const pickId = 'awd_' + req.user.id + '_' + seasonYear;

    db.prepare(`
      INSERT INTO awards_picks (
        id, user_id, season_year, heisman_winner_id, heisman_winner_name,
        heisman_winner_school, heisman_winner_logo, cfp_champion_name, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
      )
      ON CONFLICT(user_id, season_year) DO UPDATE SET
        heisman_winner_id = excluded.heisman_winner_id,
        heisman_winner_name = excluded.heisman_winner_name,
        heisman_winner_school = excluded.heisman_winner_school,
        heisman_winner_logo = excluded.heisman_winner_logo,
        cfp_champion_name = COALESCE(excluded.cfp_champion_name, awards_picks.cfp_champion_name),
        updated_at = CURRENT_TIMESTAMP
    `).run(
      pickId,
      req.user.id,
      seasonYear,
      candidate ? candidate.id : heismanWinnerId,
      candidate ? candidate.name : '',
      candidate ? candidate.school : '',
      candidate ? candidate.logoUrl : '',
      cfpChampionName || ''
    );

    const updated = db.prepare('SELECT * FROM awards_picks WHERE user_id = ? AND season_year = ?').get(req.user.id, seasonYear);
    return res.json({ message: 'Award predictions saved', pick: updated });
  } catch (err) {
    console.error('Save awards pick error:', err);
    return res.status(500).json({ error: 'Failed to save award predictions' });
  }
});

module.exports = router;
