let app;
let initError = null;

try {
  app = require('../server/index.js');
} catch (e) {
  initError = e;
  console.error('Fatal initialization error loading server in api/index.js:', e);
}

module.exports = (req, res) => {
  if (initError) {
    return res.status(500).json({
      error: 'Server failed to initialize',
      message: initError.message,
      stack: initError.stack
    });
  }
  return app(req, res);
};
// Vercel redeploy Fri Sep  4 03:15:00 EDT 2026 - Real-time team W-L records calculation and live sync


