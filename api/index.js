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

