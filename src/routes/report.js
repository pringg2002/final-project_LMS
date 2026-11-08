const router = require('express').Router();
const controller = require('../controllers/report.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../lib/roles');

router.use(auth, role(ROLES.ADMIN));

router.get('/student-roles', asyncHandler(controller.studentRoles));
router.get('/course-modules', asyncHandler(controller.courseModules));
router.get('/lessons-without-resources', asyncHandler(controller.lessonsWithoutResources));
router.get('/quiz-questions', asyncHandler(controller.quizQuestions));
router.get('/assignments-without-submissions', asyncHandler(controller.assignmentsWithoutSubmissions));
router.get('/enrollment-activity', asyncHandler(controller.enrollmentActivity));

module.exports = router;