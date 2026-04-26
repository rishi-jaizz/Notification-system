require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');

const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const setupSocket = require('./socket');
const createEmailWorker = require('./queues/workers/emailWorker');
const createSmsWorker = require('./queues/workers/smsWorker');

const app = express();
const server = http.createServer(app);

// ─── CORS ────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map((s) => s.trim());

const corsOptions = { origin: allowedOrigins, credentials: true };

// ─── Socket.IO ────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
});

setupSocket(io);

// ─── Queue Workers ────────────────────────────────────────────
const emailWorker = createEmailWorker(io);
const smsWorker = createSmsWorker(io);

// ─── Express Middleware ───────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Attach Socket.IO instance to all requests
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/users', require('./routes/users'));
app.use('/api/queue', require('./routes/queue'));

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' })
);

// ─── 404 & Error Handler ──────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);

server.listen(PORT, () => {
  logger.info(`🚀 NotifyHub API listening on http://localhost:${PORT}`);
  logger.info(`🔌 Socket.IO WebSocket server ready`);
  logger.info(`📧 Email queue worker active`);
  logger.info(`📱 SMS queue worker active`);
  logger.info(`🌍 CORS allowed origins: ${allowedOrigins.join(', ')}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully...`);
  await emailWorker.close();
  await smsWorker.close();
  server.close(() => {
    logger.info('HTTP server closed. Exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
