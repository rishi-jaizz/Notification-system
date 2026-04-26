const prisma = require('../config/database');
const emailQueue = require('../queues/emailQueue');
const smsQueue = require('../queues/smsQueue');
const templateService = require('./templateService');
const logger = require('../config/logger');

async function createNotification({ userId, type, title, message, templateId, variables, metadata }) {
  let finalTitle = title;
  let finalMessage = message;

  // Render from template if templateId provided
  if (templateId) {
    const rendered = await templateService.renderById(templateId, variables || {});
    if (rendered.subject) finalTitle = rendered.subject;
    finalMessage = rendered.body;
  }

  // Create the notification record
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title: finalTitle || 'Notification',
      message: finalMessage || '',
      status: type === 'IN_APP' ? 'UNREAD' : 'PENDING',
      metadata: metadata || {},
    },
    include: { user: { select: { id: true, name: true, email: true, phone: true, preferences: true } } },
  });

  // Queue delivery job for EMAIL
  if (type === 'EMAIL' && notification.user.email) {
    const job = await emailQueue.add('send-email', {
      notificationId: notification.id,
      to: notification.user.email,
      subject: finalTitle,
      body: finalMessage,
    });
    await prisma.notificationJob.create({
      data: {
        notificationId: notification.id,
        jobId: job.id,
        queueName: 'email-notifications',
        status: 'waiting',
      },
    });
    logger.info(`📧 Email job ${job.id} queued for notification ${notification.id}`);
  }

  // Queue delivery job for SMS
  if (type === 'SMS' && notification.user.phone) {
    const job = await smsQueue.add('send-sms', {
      notificationId: notification.id,
      to: notification.user.phone,
      body: finalMessage,
    });
    await prisma.notificationJob.create({
      data: {
        notificationId: notification.id,
        jobId: job.id,
        queueName: 'sms-notifications',
        status: 'waiting',
      },
    });
    logger.info(`📱 SMS job ${job.id} queued for notification ${notification.id}`);
  }

  return notification;
}

async function listNotifications({ userId, unread, type, from, to, page = 1, limit = 20 }) {
  const where = { userId };

  if (unread === 'true' || unread === true) {
    where.status = 'UNREAD';
  }
  if (type) where.type = type;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    total,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(total / limitNum),
  };
}

async function markAsRead(id, userId) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { status: 'READ', readAt: new Date() },
  });
}

async function markAllAsRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, status: 'UNREAD' },
    data: { status: 'READ', readAt: new Date() },
  });
}

async function deleteNotification(id, userId) {
  return prisma.notification.deleteMany({ where: { id, userId } });
}

async function getUnreadCount(userId) {
  return prisma.notification.count({ where: { userId, status: 'UNREAD' } });
}

module.exports = {
  createNotification,
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
};
