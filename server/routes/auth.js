const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db/database');
const { generateToken, authenticateToken } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, displayName, favoriteTeam = 'Georgia Bulldogs', jerseyNumber = '7' } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email.toLowerCase(), username.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email or username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
    const finalDisplayName = displayName || username;

    db.prepare(`
      INSERT INTO users (id, email, username, password_hash, display_name, favorite_team, jersey_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, email.toLowerCase(), username.toLowerCase(), passwordHash, finalDisplayName, favoriteTeam, jerseyNumber);

    // Auto-enroll into the default public "All-American Pick'em League"
    const defaultParty = db.prepare('SELECT id FROM parties WHERE id = ?').get('pty_all_american');
    if (defaultParty) {
      const memberId = 'pm_' + crypto.randomBytes(6).toString('hex');
      db.prepare(`
        INSERT INTO party_members (id, party_id, user_id, role)
        VALUES (?, ?, ?, 'member')
      `).run(memberId, defaultParty.id, userId);
    }

    const newUser = db.prepare('SELECT id, email, username, display_name, favorite_team, avatar_url, jersey_number, total_points, correct_picks, total_picks, current_streak, best_streak FROM users WHERE id = ?').get(userId);
    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body; // login can be username or email

    if (!login || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    const user = db.prepare(`
      SELECT * FROM users 
      WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)
    `).get(login.trim(), login.trim());

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. Please check your username/email.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const { password_hash, ...userProfile } = user;
    const token = generateToken(userProfile);

    return res.json({
      message: 'Logged in successfully',
      token,
      user: userProfile
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, email, username, display_name, favorite_team, avatar_url, jersey_number, total_points, correct_picks, total_picks, current_streak, best_streak FROM users WHERE id = ?').get(req.user.id);
  return res.json({ user: user || req.user });
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { displayName, favoriteTeam, avatarUrl, jerseyNumber } = req.body;
    db.prepare(`
      UPDATE users 
      SET display_name = COALESCE(?, display_name),
          favorite_team = COALESCE(?, favorite_team),
          avatar_url = COALESCE(?, avatar_url),
          jersey_number = COALESCE(?, jersey_number),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      displayName !== undefined ? displayName : null,
      favoriteTeam !== undefined ? favoriteTeam : null,
      avatarUrl !== undefined ? avatarUrl : null,
      jerseyNumber !== undefined ? jerseyNumber : null,
      req.user.id
    );

    const updatedUser = db.prepare('SELECT id, email, username, display_name, favorite_team, avatar_url, jersey_number, total_points, correct_picks, total_picks, current_streak, best_streak FROM users WHERE id = ?').get(req.user.id);
    return res.json({ message: 'Profile updated', user: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/auth/demo-users (For quick multi-user testing & demonstration)
router.get('/demo-users', (req, res) => {
  const users = db.prepare(`
    SELECT id, email, username, display_name, favorite_team, avatar_url, jersey_number, total_points, correct_picks, total_picks, current_streak
    FROM users 
    LIMIT 8
  `).all();
  return res.json({ demoUsers: users });
});

// POST /api/auth/switch-demo
router.post('/switch-demo', (req, res) => {
  try {
    const { userId } = req.body;
    const user = db.prepare('SELECT id, email, username, display_name, favorite_team, avatar_url, jersey_number, total_points, correct_picks, total_picks, current_streak, best_streak FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({ error: 'Demo user not found' });
    }

    const token = generateToken(user);
    return res.json({
      message: `Switched perspective to ${user.display_name}`,
      token,
      user
    });
  } catch (err) {
    console.error('Switch demo error:', err);
    return res.status(500).json({ error: 'Failed to switch demo user' });
  }
});

module.exports = router;
