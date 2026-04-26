const { Queue } = require('bullmq');
const { redisConfig } = require('../config/redis');

const smsQueue = new Queue('sms-notifications', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

module.exports = smsQueue;
