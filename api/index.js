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
// Vercel redeploy Sun Sep 20 21:11:00 EDT 2026 - Fixed distinct Winner Splits, O/U Splits, and detailed divergence banners
