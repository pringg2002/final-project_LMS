const router = require('express').Router();
const enrollmentController = require('../controllers/enrollment.controller');
const announcementController = require('../controllers/announcement.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../lib/roles');

const staff = role(ROLES.ADMIN, ROLES.INSTRUCTOR);

router.get('/enrollments', auth, asyncHandler(enrollmentController.list)); 
router.get('/enrollments/:id', auth, asyncHandler(enrollmentController.get));
router.post('/enrollments', auth, role(ROLES.ADMIN), asyncHandler(enrollmentController.create));
router.put('/enrollments/:id', auth, role(ROLES.ADMIN), asyncHandler(enrollmentController.update));
router.delete('/enrollments/:id', auth, role(ROLES.ADMIN), asyncHandler(enrollmentController.remove));

router.get('/courses/:courseId/announcements', auth, asyncHandler(announcementController.listByCourse));
router.post('/courses/:courseId/announcements', auth, staff, asyncHandler(announcementController.createInCourse));
router.get('/announcements/:id', auth, asyncHandler(announcementController.get));
router.put('/announcements/:id', auth, staff, asyncHandler(announcementController.update));
router.delete('/announcements/:id', auth, staff, asyncHandler(announcementController.remove));

module.exports = router;
