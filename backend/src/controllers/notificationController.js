const notificationService = require('../services/notificationService');
const prisma = require('../config/database');

async function create(req, res, next) {
  try {
    const { type, title, message, templateId, variables, metadata, targetUserId } = req.body;
    if (!type) return res.status(400).json({ success: false, message: 'type is required' });

    const userId = targetUserId || req.user.id;

    const notification = await notificationService.createNotification({
      userId,
      type,
      title,
      message,
      templateId,
      variables,
      metadata,
    });

    // Real-time push via Socket.IO
    if (req.io) {
      req.io.to(userId).emit('notification:new', notification);
      const count = await notificationService.getUnreadCount(userId);
      req.io.to(userId).emit('unread_count', count);
    }

    res.status(201).json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { unread, type, from, to, page = 1, limit = 20 } = req.query;
    const result = await notificationService.listNotifications({
      userId: req.user.id,
      unread,
      type,
      from,
      to,
      page,
      limit,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    await notificationService.markAsRead(req.params.id, req.user.id);
    const count = await notificationService.getUnreadCount(req.user.id);
    if (req.io) req.io.to(req.user.id).emit('unread_count', count);
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    if (req.io) req.io.to(req.user.id).emit('unread_count', 0);
    res.json({ success: true, message: `${result.count} notifications marked as read` });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await notificationService.deleteNotification(req.params.id, req.user.id);
    const count = await notificationService.getUnreadCount(req.user.id);
    if (req.io) req.io.to(req.user.id).emit('unread_count', count);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
}

async function unreadCount(req, res, next) {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, markRead, markAllRead, remove, unreadCount };
