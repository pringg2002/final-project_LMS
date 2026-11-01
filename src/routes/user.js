const router = require('express').Router();
const controller = require('../controllers/user.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../lib/roles');

router.use(auth);

router.get('/', role(ROLES.ADMIN), asyncHandler(controller.list));
router.post('/', role(ROLES.ADMIN), asyncHandler(controller.create));
router.get('/:id', asyncHandler(controller.get));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', role(ROLES.ADMIN), asyncHandler(controller.remove));

module.exports = router;