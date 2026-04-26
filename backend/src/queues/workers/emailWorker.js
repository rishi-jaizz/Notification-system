const { Worker } = require('bullmq');
const { redisConfig } = require('../../config/redis');
const emailService = require('../../services/emailService');
const prisma = require('../../config/database');
const logger = require('../../config/logger');

function createEmailWorker(io) {
  const worker = new Worker(
    'email-notifications',
    async (job) => {
      const { notificationId, to, subject, body } = job.data;
      logger.info(`📧 Processing email job ${job.id} → notification ${notificationId}`);

      await prisma.notificationJob.updateMany({
        where: { jobId: job.id, notificationId },
        data: { status: 'active', attempts: job.attemptsMade + 1 },
      });

      await emailService.send({ to, subject, body });

      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'SENT' },
      });

      await prisma.notificationJob.updateMany({
        where: { jobId: job.id, notificationId },
        data: { status: 'completed' },
      });

      if (io) {
        const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
        if (notification) {
          io.to(notification.userId).emit('notification:updated', notification);
        }
      }

      logger.info(`✅ Email job ${job.id} completed`);
    },
    { connection: redisConfig, concurrency: 5 }
  );

  worker.on('failed', async (job, err) => {
    logger.error(`❌ Email job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
    if (job) {
      await prisma.notificationJob.updateMany({
        where: { jobId: job.id },
        data: { status: 'failed', lastError: err.message },
      });
      if (job.attemptsMade >= (job.opts.attempts || 3)) {
        await prisma.notification.updateMany({
          where: { id: job.data.notificationId },
          data: { status: 'FAILED' },
        });
      }
    }
  });

  logger.info('📧 Email queue worker started');
  return worker;
}

module.exports = createEmailWorker;
