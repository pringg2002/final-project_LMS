const router = require('express').Router();
const controller = require('../controllers/answer.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../lib/roles');

const student = role(ROLES.STUDENT);

router.get('/attempts/:attemptId/answers', auth, asyncHandler(controller.listByAttempt));
router.post('/attempts/:attemptId/answers', auth, student, asyncHandler(controller.save));
router.put('/answers/:id', auth, student, asyncHandler(controller.update));

module.exports = router;
