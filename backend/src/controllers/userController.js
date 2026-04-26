const prisma = require('../config/database');

async function getMe(req, res) {
  const { password: _, ...user } = req.user;
  res.json({ success: true, data: user });
}

async function updatePreferences(req, res, next) {
  try {
    const { email, sms, inApp, phone } = req.body;
    const preferences = {
      email: email !== undefined ? Boolean(email) : true,
      sms: sms !== undefined ? Boolean(sms) : true,
      inApp: inApp !== undefined ? Boolean(inApp) : true,
    };

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { preferences, phone: phone || req.user.phone },
      select: { id: true, name: true, email: true, phone: true, preferences: true, updatedAt: true },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updatePreferences, listUsers };
