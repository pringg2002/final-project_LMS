const router = require('express').Router();
const controller = require('../controllers/user.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../lib/roles');

router.use(auth);

router.get(
  '/',
  role(ROLES.ADMIN),
  asyncHandler(controller.list)
);

router.get(
  '/students',
  role(ROLES.ADMIN, ROLES.INSTRUCTOR),
  asyncHandler(controller.listStudents)
);

router.post(
  '/',
  role(ROLES.ADMIN),
  asyncHandler(controller.create)
);

router.get(
  '/:id',
  asyncHandler(controller.get)
);

router.put(
  '/:id',
  asyncHandler(controller.update)
);

router.post(
  '/:id/reset-password',
  role(ROLES.ADMIN),
  asyncHandler(controller.resetPassword)
);

router.delete(
  '/:id',
  role(ROLES.ADMIN),
  asyncHandler(controller.remove)
);

module.exports = router;