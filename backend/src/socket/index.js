const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

function setupSocket(io) {
  // JWT authentication middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id} (userId: ${socket.userId})`);

    // Join the user's private room for targeted notifications
    socket.join(socket.userId);

    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Socket disconnected: ${socket.id} (reason: ${reason})`);
    });
  });

  logger.info('🔌 Socket.IO set up successfully');
}

module.exports = setupSocket;
