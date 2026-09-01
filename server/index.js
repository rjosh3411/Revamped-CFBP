const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const gamesRoutes = require('./routes/games');
const picksRoutes = require('./routes/picks');
const partiesRoutes = require('./routes/parties');
const comparisonRoutes = require('./routes/comparison');
const rankingsRoutes = require('./routes/rankings');
const teamsRoutes = require('./routes/teams');
const heismanRoutes = require('./routes/heisman');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/picks', picksRoutes);
app.use('/api/parties', partiesRoutes);
app.use('/api/comparison', comparisonRoutes);
app.use('/api/rankings', rankingsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/heisman', heismanRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), app: 'Revamped CFB predictions' });
});

// Serve frontend static build in production
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  const indexHtml = path.join(clientDistPath, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send('CFB Predictions Server Running. Frontend is compiling...');
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏈 CFB Prediction Party server is running on http://localhost:${PORT} and http://127.0.0.1:${PORT}`);
});

module.exports = app;
