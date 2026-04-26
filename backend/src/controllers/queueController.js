const emailQueue = require('../queues/emailQueue');
const smsQueue = require('../queues/smsQueue');

async function getStatus(req, res, next) {
  try {
    const [emailCounts, smsCounts] = await Promise.all([
      emailQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
      smsQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
    ]);
    res.json({
      success: true,
      data: {
        email: { name: 'email-notifications', ...emailCounts },
        sms: { name: 'sms-notifications', ...smsCounts },
      },
    });
  } catch (err) {
    next(err);
  }
}

async function retryJob(req, res, next) {
  try {
    const { queue, jobId } = req.params;
    const q = queue === 'email' ? emailQueue : smsQueue;
    const job = await q.getJob(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    await job.retry();
    res.json({ success: true, message: `Job ${jobId} retried` });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStatus, retryJob };
