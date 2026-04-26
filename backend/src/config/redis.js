const { Redis } = require('ioredis');
const logger = require('./logger');

// Common options required for BullMQ
const commonOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

let redis;
let redisConfig;

if (process.env.REDIS_URL) {
  // Use connection string for Render/Production
  redis = new Redis(process.env.REDIS_URL, commonOptions);
  redisConfig = { url: process.env.REDIS_URL, ...commonOptions };
} else {
  // Fallback to host/port for local development
  redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    ...commonOptions,
  };
  redis = new Redis(redisConfig);
}

redis.on('connect', () => logger.info('✅ Redis connected'));
redis.on('error', (err) => logger.error(`❌ Redis error: ${err.message}`));

module.exports = { redis, redisConfig };
