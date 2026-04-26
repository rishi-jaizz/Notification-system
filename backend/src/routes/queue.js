const express = require('express');
const auth = require('../middleware/auth');
const { getStatus, retryJob } = require('../controllers/queueController');
const router = express.Router();

router.use(auth);

router.get('/status', getStatus);
router.post('/retry/:queue/:jobId', retryJob);

module.exports = router;
