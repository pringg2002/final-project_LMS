const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.post(
  '/register',
  asyncHandler(controller.register)
);

router.post(
  '/login',
  asyncHandler(controller.login)
);

router.get(
  '/me',
  auth,
  asyncHandler(controller.me)
);

router.post(
  '/change-password',
  auth,
  asyncHandler(controller.changePassword)
);

module.exports = router;