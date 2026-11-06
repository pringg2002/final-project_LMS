const router = require('express').Router();
const courseController = require('../controllers/course.controller');
const moduleController = require('../controllers/module.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../lib/roles');

const staff = role(ROLES.ADMIN, ROLES.INSTRUCTOR);

router.get('/courses', auth, asyncHandler(courseController.list));
router.get('/courses/:id', auth, asyncHandler(courseController.get));
router.post('/courses', auth, staff, asyncHandler(courseController.create));
router.put('/courses/:id', auth, staff, asyncHandler(courseController.update));
router.delete('/courses/:id', auth, staff, asyncHandler(courseController.remove));

router.get('/courses/:courseId/modules', auth, asyncHandler(moduleController.listByCourse));
router.post('/courses/:courseId/modules', auth, staff, asyncHandler(moduleController.createInCourse));

module.exports = router;
