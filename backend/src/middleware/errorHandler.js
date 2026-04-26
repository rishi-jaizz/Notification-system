const logger = require('../config/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  logger.error(`[${status}] ${req.method} ${req.path} — ${message}`);
  if (process.env.NODE_ENV === 'development' && err.stack) {
    logger.error(err.stack);
  }

  res.status(status).json({ success: false, message });
}

module.exports = errorHandler;
