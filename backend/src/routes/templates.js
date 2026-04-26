const express = require('express');
const auth = require('../middleware/auth');
const c = require('../controllers/templateController');
const router = express.Router();

router.use(auth);

router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', c.getById);
router.put('/:id', c.update);
router.delete('/:id', c.remove);
router.post('/:id/preview', c.preview);

module.exports = router;
