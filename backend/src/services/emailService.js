const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    logger.info('📧 SMTP email transporter configured');
  } else {
    logger.warn('⚠️  SMTP not configured — emails will be simulated (logged to console)');
  }

  return transporter;
}

async function send({ to, subject, body }) {
  const t = getTransporter();

  if (!t) {
    logger.info(`[EMAIL SIMULATION]\n  To: ${to}\n  Subject: ${subject}\n  Body: ${body}`);
    return { messageId: `sim-${Date.now()}`, simulated: true };
  }

  const info = await t.sendMail({
    from: process.env.SMTP_FROM || '"NotifyHub" <noreply@example.com>',
    to,
    subject,
    html: body,
  });

  logger.info(`📧 Email sent → messageId: ${info.messageId}`);
  return info;
}

module.exports = { send };
