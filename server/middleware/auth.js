const jwt = require('jsonwebtoken');
const db = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'cfb_super_secret_jwt_key_2026_prediction_party';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    try {
      const user = await db.prepare('SELECT id, email, username, display_name, favorite_team, avatar_url, jersey_number, total_points, correct_picks, total_picks, current_streak, best_streak FROM users WHERE id = ?').get(decoded.id);
      if (!user) {
        return res.status(404).json({ error: 'User no longer exists' });
      }

      req.user = user;
      next();
    } catch (dbErr) {
      console.error('Auth verification error:', dbErr);
      return res.status(500).json({ error: 'Authentication database lookup failed' });
    }
  });
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (!err && decoded) {
      try {
        const user = await db.prepare('SELECT id, email, username, display_name, favorite_team, avatar_url, jersey_number, total_points, correct_picks, total_picks, current_streak, best_streak FROM users WHERE id = ?').get(decoded.id);
        req.user = user || null;
      } catch (e) {
        req.user = null;
      }
    }
    next();
  });
}

module.exports = {
  generateToken,
  authenticateToken,
  optionalAuth,
  JWT_SECRET
};
