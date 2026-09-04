const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const gradingService = require('../services/gradingService');
const { authenticateToken } = require('../middleware/auth');

function generatePartyCode(prefix = 'CFB') {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${randomPart}`;
}

// GET /api/parties/my-parties
router.get('/my-parties', authenticateToken, async (req, res) => {
  try {
    const parties = await db.prepare(`
      SELECT p.*, pm.role as user_role, pm.joined_at,
             (SELECT COUNT(*) FROM party_members WHERE party_id = p.id) as member_count,
             u.display_name as creator_name
      FROM parties p
      JOIN party_members pm ON p.id = pm.party_id
      JOIN users u ON p.creator_id = u.id
      WHERE pm.user_id = ?
      ORDER BY pm.joined_at DESC
    `).all(req.user.id);

    return res.json({ parties });
  } catch (err) {
    console.error('My parties error:', err);
    return res.status(500).json({ error: 'Failed to retrieve parties' });
  }
});

// POST /api/parties/create
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      description = '', 
      conferenceFocus = 'ALL', 
      scoringType = 'STRAIGHT_UP',
      icon = '🏈' 
    } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Party name is required' });
    }

    const partyId = 'pty_' + crypto.randomBytes(8).toString('hex');
    const prefix = conferenceFocus && conferenceFocus !== 'ALL' ? conferenceFocus.substring(0, 3).toUpperCase() : 'CFB';
    let inviteCode = generatePartyCode(prefix);

    let attempts = 0;
    while (attempts < 5 && await db.prepare('SELECT id FROM parties WHERE invite_code = ?').get(inviteCode)) {
      inviteCode = generatePartyCode(prefix);
      attempts++;
    }

    await db.prepare(`
      INSERT INTO parties (id, name, description, invite_code, creator_id, conference_focus, scoring_type, icon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(partyId, name.trim(), description.trim(), inviteCode, req.user.id, conferenceFocus, scoringType, icon);

    const memberId = 'pm_' + crypto.randomBytes(6).toString('hex');
    await db.prepare(`
      INSERT INTO party_members (id, party_id, user_id, role)
      VALUES (?, ?, ?, 'owner')
    `).run(memberId, partyId, req.user.id);

    const msgId = 'msg_' + crypto.randomBytes(8).toString('hex');
    await db.prepare(`
      INSERT INTO party_messages (id, party_id, user_id, message, type)
      VALUES (?, ?, ?, ?, 'system')
    `).run(msgId, partyId, req.user.id, `🎉 Welcome to ${name}! Scoring Mode: ${scoringType}. Invite code: ${inviteCode}`);

    const createdParty = await db.prepare('SELECT * FROM parties WHERE id = ?').get(partyId);
    return res.status(201).json({
      message: 'Prediction party created!',
      party: createdParty
    });
  } catch (err) {
    console.error('Create party error:', err);
    return res.status(500).json({ error: 'Failed to create party' });
  }
});

// POST /api/parties/join
router.post('/join', authenticateToken, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const cleanCode = inviteCode.trim().toUpperCase();
    const party = await db.prepare('SELECT * FROM parties WHERE UPPER(invite_code) = ?').get(cleanCode);

    if (!party) {
      return res.status(404).json({ error: 'No prediction party found with invite code: ' + cleanCode });
    }

    const existing = await db.prepare('SELECT id FROM party_members WHERE party_id = ? AND user_id = ?').get(party.id, req.user.id);
    if (existing) {
      return res.status(400).json({ error: 'You are already a member of this party!' });
    }

    const memberId = 'pm_' + crypto.randomBytes(6).toString('hex');
    await db.prepare(`
      INSERT INTO party_members (id, party_id, user_id, role)
      VALUES (?, ?, ?, 'member')
    `).run(memberId, party.id, req.user.id);

    const msgId = 'msg_' + crypto.randomBytes(8).toString('hex');
    await db.prepare(`
      INSERT INTO party_messages (id, party_id, user_id, message, type)
      VALUES (?, ?, ?, ?, 'system')
    `).run(msgId, party.id, req.user.id, `👋 ${req.user.display_name} has joined the party!`);

    return res.json({
      message: `Successfully joined ${party.name}!`,
      party
    });
  } catch (err) {
    console.error('Join party error:', err);
    return res.status(500).json({ error: 'Failed to join party' });
  }
});

// POST /api/parties/:id/leave
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const partyId = req.params.id;

    const membership = await db.prepare('SELECT * FROM party_members WHERE party_id = ? AND user_id = ?').get(partyId, req.user.id);
    if (!membership) {
      return res.status(404).json({ error: 'You are not a member of this party' });
    }

    const party = await db.prepare('SELECT * FROM parties WHERE id = ?').get(partyId);
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }

    const otherMembers = await db.prepare('SELECT * FROM party_members WHERE party_id = ? AND user_id != ? ORDER BY joined_at ASC').all(partyId, req.user.id);

    if (membership.role === 'owner') {
      if (otherMembers.length > 0) {
        const newOwner = otherMembers[0];
        await db.prepare('UPDATE party_members SET role = \'owner\' WHERE id = ?').run(newOwner.id);
        await db.prepare('UPDATE parties SET creator_id = ? WHERE id = ?').run(newOwner.user_id, partyId);
      } else {
        await db.prepare('DELETE FROM parties WHERE id = ?').run(partyId);
        return res.json({ message: `You have left and closed ${party.name}`, partyId });
      }
    }

    await db.prepare('DELETE FROM party_members WHERE party_id = ? AND user_id = ?').run(partyId, req.user.id);

    const msgId = 'msg_' + crypto.randomBytes(8).toString('hex');
    await db.prepare(`
      INSERT INTO party_messages (id, party_id, user_id, message, type)
      VALUES (?, ?, ?, ?, 'system')
    `).run(msgId, partyId, req.user.id, `🚪 ${req.user.display_name} has left the party.`);

    return res.json({
      message: `You have successfully left ${party.name}`,
      partyId
    });
  } catch (err) {
    console.error('Leave party error:', err);
    return res.status(500).json({ error: 'Failed to leave party' });
  }
});

// GET /api/parties/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const partyId = req.params.id;

    // Auto-sync live scores before calculating party leaderboard
    await gradingService.syncAndGradeLiveScores().catch(e => console.warn('Party grading warning:', e));
    const party = await db.prepare(`
      SELECT p.*, u.display_name as creator_name
      FROM parties p
      JOIN users u ON p.creator_id = u.id
      WHERE p.id = ?
    `).get(partyId);

    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }

    const members = await db.prepare(`
      SELECT u.id, u.username, u.display_name, u.favorite_team, u.avatar_url,
             u.total_points, u.correct_picks, u.total_picks, u.current_streak, u.best_streak,
             pm.role, pm.joined_at,
             (SELECT COUNT(*) FROM picks WHERE user_id = u.id AND is_correct = 1) as party_correct,
             (SELECT COUNT(*) FROM picks WHERE user_id = u.id) as party_total_picks,
             (SELECT COALESCE(SUM(points_awarded), 0) FROM picks WHERE user_id = u.id) as party_points
      FROM party_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.party_id = ?
      ORDER BY party_points DESC, party_correct DESC, u.display_name ASC
    `).all(partyId);

    const leaderboard = members.map((m, index) => {
      const winPct = m.party_total_picks > 0 ? Math.round((m.party_correct / m.party_total_picks) * 100) : 0;
      return {
        ...m,
        rank: index + 1,
        winPercentage: winPct
      };
    });

    return res.json({
      party,
      members: leaderboard
    });
  } catch (err) {
    console.error('Party details error:', err);
    return res.status(500).json({ error: 'Failed to fetch party details' });
  }
});

// GET /api/parties/:id/messages
router.get('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const partyId = req.params.id;
    const messages = await db.prepare(`
      SELECT m.*, u.display_name, u.username, u.favorite_team, u.avatar_url
      FROM party_messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.party_id = ?
      ORDER BY m.created_at ASC
      LIMIT 100
    `).all(partyId);

    return res.json({ messages });
  } catch (err) {
    console.error('Fetch messages error:', err);
    return res.status(500).json({ error: 'Failed to fetch party messages' });
  }
});

// POST /api/parties/:id/messages
router.post('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const partyId = req.params.id;
    const { message, type = 'chat' } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const msgId = 'msg_' + crypto.randomBytes(8).toString('hex');
    await db.prepare(`
      INSERT INTO party_messages (id, party_id, user_id, message, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(msgId, partyId, req.user.id, message.trim(), type);

    const inserted = await db.prepare(`
      SELECT m.*, u.display_name, u.username, u.favorite_team, u.avatar_url
      FROM party_messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `).get(msgId);

    return res.status(201).json({ message: inserted });
  } catch (err) {
    console.error('Post message error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// POST /api/parties/:id/sync-picks
// Syncs and brings over all user predictions and stats into this party
router.post('/:id/sync-picks', authenticateToken, async (req, res) => {
  try {
    const partyId = req.params.id;

    // Verify user is a member
    const membership = await db.prepare('SELECT * FROM party_members WHERE party_id = ? AND user_id = ?').get(partyId, req.user.id);
    if (!membership) {
      return res.status(403).json({ error: 'You must be a member of this party to sync picks' });
    }

    // Count user's total picks, wins, and confidence points
    const picksCountRes = await db.prepare('SELECT COUNT(*) as total FROM picks WHERE user_id = ?').get(req.user.id);
    const totalPicks = picksCountRes?.total || 0;

    const correctPicksRes = await db.prepare('SELECT COUNT(*) as correct FROM picks WHERE user_id = ? AND is_correct = 1').get(req.user.id);
    const correctPicks = correctPicksRes?.correct || 0;

    const pointsRes = await db.prepare('SELECT COALESCE(SUM(points_awarded), 0) as points FROM picks WHERE user_id = ?').get(req.user.id);
    const totalPoints = pointsRes?.points || 0;

    // Update users table to ensure parity
    await db.prepare('UPDATE users SET total_picks = ?, correct_picks = ?, total_points = ? WHERE id = ?').run(
      totalPicks,
      correctPicks,
      totalPoints,
      req.user.id
    );

    return res.json({
      success: true,
      message: `🎉 All ${totalPicks} of your 2026 predictions are synced and active in this party!`,
      totalPicks,
      correctPicks,
      totalPoints
    });
  } catch (err) {
    console.error('Sync party picks error:', err);
    return res.status(500).json({ error: 'Failed to sync party picks' });
  }
});

module.exports = router;
