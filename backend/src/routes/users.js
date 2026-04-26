const express = require('express');
const auth = require('../middleware/auth');
const { getMe, updatePreferences, listUsers } = require('../controllers/userController');
const router = express.Router();

router.use(auth);

router.get('/me', getMe);
router.patch('/me/preferences', updatePreferences);
router.get('/', listUsers); // For target user selector in send form

module.exports = router;
