const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ─── Users ─────────────────────────────────────────────────────
  const password = await bcrypt.hash('demo1234', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '+1555000001',
      password,
      preferences: { email: true, sms: true, inApp: true },
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      name: 'Bob Smith',
      email: 'bob@example.com',
      phone: '+1555000002',
      password,
      preferences: { email: true, sms: false, inApp: true },
    },
  });

  console.log(`✅ Users created: ${alice.name}, ${bob.name}`);

  // ─── Templates ──────────────────────────────────────────────────
  const welcomeTemplate = await prisma.template.upsert({
    where: { id: 'tpl-welcome' },
    update: {},
    create: {
      id: 'tpl-welcome',
      name: 'Welcome Email',
      type: 'EMAIL',
      subject: 'Welcome to NotifyHub, {{name}}! 🎉',
      body: '<h2>Hi {{name}},</h2><p>Welcome to <strong>NotifyHub</strong>! Your account is ready. Visit your dashboard to get started.</p><p>Cheers,<br/>The NotifyHub Team</p>',
      variables: ['name'],
    },
  });

  const orderTemplate = await prisma.template.upsert({
    where: { id: 'tpl-order' },
    update: {},
    create: {
      id: 'tpl-order',
      name: 'Order Confirmation SMS',
      type: 'SMS',
      body: 'Hi {{name}}, your order #{{orderId}} has been confirmed! Estimated delivery: {{deliveryDate}}. Thanks for choosing us!',
      variables: ['name', 'orderId', 'deliveryDate'],
    },
  });

  const alertTemplate = await prisma.template.upsert({
    where: { id: 'tpl-alert' },
    update: {},
    create: {
      id: 'tpl-alert',
      name: 'Security Alert',
      type: 'IN_APP',
      subject: 'Security Alert — Unusual Login Detected',
      body: 'Hi {{name}}, we detected a login to your account from {{location}} at {{time}}. If this was not you, please reset your password immediately.',
      variables: ['name', 'location', 'time'],
    },
  });

  const promoTemplate = await prisma.template.upsert({
    where: { id: 'tpl-promo' },
    update: {},
    create: {
      id: 'tpl-promo',
      name: 'Promotional Email',
      type: 'EMAIL',
      subject: '{{discount}}% Off — Exclusive Offer for {{name}}!',
      body: '<h2>Hello {{name}}!</h2><p>You have an exclusive <strong>{{discount}}% discount</strong> waiting for you. Use code <code>{{code}}</code> at checkout. Expires: {{expiry}}.</p>',
      variables: ['name', 'discount', 'code', 'expiry'],
    },
  });

  console.log(`✅ Templates created: ${welcomeTemplate.name}, ${orderTemplate.name}, ${alertTemplate.name}, ${promoTemplate.name}`);

  // ─── Sample Notifications for Alice ────────────────────────────
  const now = new Date();
  const notifs = [
    {
      userId: alice.id,
      type: 'IN_APP',
      title: 'Welcome to NotifyHub! 🎉',
      message: 'Your account has been set up successfully. Explore the dashboard to send your first notification.',
      status: 'UNREAD',
      createdAt: new Date(now - 1000 * 60 * 2),
    },
    {
      userId: alice.id,
      type: 'EMAIL',
      title: 'Your weekly report is ready',
      message: 'Your notification analytics for the past week are now available. You sent 42 notifications with a 98% delivery rate.',
      status: 'SENT',
      createdAt: new Date(now - 1000 * 60 * 60),
    },
    {
      userId: alice.id,
      type: 'IN_APP',
      title: 'New team member joined',
      message: 'Bob Smith joined your workspace. You can now send notifications to them.',
      status: 'READ',
      readAt: new Date(now - 1000 * 60 * 30),
      createdAt: new Date(now - 1000 * 60 * 90),
    },
    {
      userId: alice.id,
      type: 'SMS',
      title: 'Security Alert',
      message: 'New login to your account from San Francisco, CA at 10:32 AM. If this was not you, please reset your password.',
      status: 'SENT',
      createdAt: new Date(now - 1000 * 60 * 60 * 3),
    },
    {
      userId: alice.id,
      type: 'EMAIL',
      title: 'Your subscription renews tomorrow',
      message: 'Your NotifyHub Pro subscription will renew on January 15, 2026. No action needed.',
      status: 'UNREAD',
      createdAt: new Date(now - 1000 * 60 * 60 * 5),
    },
    {
      userId: alice.id,
      type: 'IN_APP',
      title: 'Queue processing complete',
      message: '128 email notifications were processed successfully. 2 failed and have been retried.',
      status: 'READ',
      readAt: new Date(now - 1000 * 60 * 60 * 8),
      createdAt: new Date(now - 1000 * 60 * 60 * 10),
    },
    {
      userId: alice.id,
      type: 'EMAIL',
      title: 'Password changed successfully',
      message: 'Your account password was changed. If you did not make this change, contact support immediately.',
      status: 'SENT',
      createdAt: new Date(now - 1000 * 60 * 60 * 24),
    },
    {
      userId: alice.id,
      type: 'IN_APP',
      title: 'Template "Welcome Email" created',
      message: 'Your email template has been saved and is ready to use.',
      status: 'READ',
      readAt: new Date(now - 1000 * 60 * 60 * 25),
      createdAt: new Date(now - 1000 * 60 * 60 * 26),
    },
  ];

  await prisma.notification.deleteMany({ where: { userId: alice.id } });
  await prisma.notification.createMany({ data: notifs });

  // Sample for Bob
  await prisma.notification.deleteMany({ where: { userId: bob.id } });
  await prisma.notification.createMany({
    data: [
      {
        userId: bob.id,
        type: 'IN_APP',
        title: 'Welcome Bob! 👋',
        message: 'You have been added to the NotifyHub workspace by Alice.',
        status: 'UNREAD',
        createdAt: new Date(now - 1000 * 60 * 10),
      },
      {
        userId: bob.id,
        type: 'EMAIL',
        title: 'Invitation to NotifyHub',
        message: 'Alice Johnson has invited you to collaborate on NotifyHub. Click here to accept.',
        status: 'SENT',
        createdAt: new Date(now - 1000 * 60 * 12),
      },
    ],
  });

  console.log('✅ Sample notifications created for Alice and Bob');
  console.log('\n🎉 Seed complete! Demo credentials:');
  console.log('   Alice: alice@example.com / demo1234');
  console.log('   Bob:   bob@example.com   / demo1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
