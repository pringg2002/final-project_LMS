const router = require('express').Router();
const controller = require('../controllers/notification.controller');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(auth);

router.get('/', asyncHandler(controller.list));
router.put('/read-all', asyncHandler(controller.markAllRead));
router.put('/:id/read', asyncHandler(controller.markRead));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;