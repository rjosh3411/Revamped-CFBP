const express = require('express');
const router = express.Router();
const espnService = require('../services/espnService');

// GET /api/rankings
router.get('/', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const rankings = await espnService.getRankings({ forceRefresh });
    return res.json({ rankings });
  } catch (err) {
    console.error('Rankings fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch AP Top 25 rankings' });
  }
});

module.exports = router;
