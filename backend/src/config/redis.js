const { Redis } = require('ioredis');
const logger = require('./logger');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
};

const redis = new Redis(redisConfig);

redis.on('connect', () => logger.info('✅ Redis connected'));
redis.on('error', (err) => logger.error(`❌ Redis error: ${err.message}`));

module.exports = { redis, redisConfig };
