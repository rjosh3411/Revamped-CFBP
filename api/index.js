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
// Vercel redeploy Wed Sep 16 19:40:00 EDT 2026 - Dynamic week selection, 401 token cleanup, and 1-tap instant demo access




