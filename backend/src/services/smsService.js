const logger = require('../config/logger');

let twilioClient = null;

function getClient() {
  if (twilioClient) return twilioClient;

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    logger.info('📱 Twilio SMS client configured');
  } else {
    logger.warn('⚠️  Twilio not configured — SMS will be simulated (logged to console)');
  }

  return twilioClient;
}

async function send({ to, body }) {
  const client = getClient();

  if (!client) {
    logger.info(`[SMS SIMULATION]\n  To: ${to}\n  Body: ${body}`);
    return { sid: `sim-${Date.now()}`, simulated: true };
  }

  const message = await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });

  logger.info(`📱 SMS sent → SID: ${message.sid}`);
  return message;
}

module.exports = { send };
