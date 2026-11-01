// Member 6 - announcements routes. Mounted at "/" (full /api/... paths, auth per route).
const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../lib/roles');

const staff = role(ROLES.ADMIN, ROLES.INSTRUCTOR);

// Announcements routes
router.get('/courses/:courseId/announcements', auth, asyncHandler(announcementController.listByCourse));
router.post('/courses/:courseId/announcements', auth, staff, asyncHandler(announcementController.createInCourse));
router.get('/announcements/:id', auth, asyncHandler(announcementController.getById));
router.put('/announcements/:id', auth, staff, asyncHandler(announcementController.update));
router.delete('/announcements/:id', auth, staff, asyncHandler(announcementController.remove));

module.exports = router;