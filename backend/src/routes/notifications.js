const express = require('express');
const auth = require('../middleware/auth');
const c = require('../controllers/notificationController');
const router = express.Router();

router.use(auth);

// Specific paths must come before parameterized ones
router.get('/unread-count', c.unreadCount);
router.patch('/read-all', c.markAllRead);

router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', c.getById);
router.patch('/:id/read', c.markRead);
router.delete('/:id', c.remove);

module.exports = router;
