// Member 6 - enrollments + announcements. Mounted at "/" (full /api/... paths, auth per route).
const router = require('express').Router();
const enrollmentController = require('../controllers/enrollment.controller');
const announcementController = require('../controllers/announcement.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../lib/roles');

const staff = role(ROLES.ADMIN, ROLES.INSTRUCTOR);

// Enrollments (students manage their own; staff manage their courses' enrollments)
router.get('/enrollments', auth, asyncHandler(enrollmentController.list)); // ?course_id=
router.get('/enrollments/:id', auth, asyncHandler(enrollmentController.get));
router.post('/enrollments', auth, asyncHandler(enrollmentController.create));
router.put('/enrollments/:id', auth, asyncHandler(enrollmentController.update));
router.delete('/enrollments/:id', auth, staff, asyncHandler(enrollmentController.remove));

// Announcements
router.get('/courses/:courseId/announcements', auth, asyncHandler(announcementController.listByCourse));
router.post('/courses/:courseId/announcements', auth, staff, asyncHandler(announcementController.createInCourse));
router.get('/announcements/:id', auth, asyncHandler(announcementController.get));
router.put('/announcements/:id', auth, staff, asyncHandler(announcementController.update));
router.delete('/announcements/:id', auth, staff, asyncHandler(announcementController.remove));

module.exports = router;