const express = require('express');
const router = express.Router();
const enrollmentRoutes = require('./enrollments');
const assignmentRoutes = require('./assignment');
const attemptAnswersRoutes = require('./attemptAnswer');
const adaptiveRoutes = require('./adaptive');
const discussionRoutes = require('./discussion');
const quizRoutes = require('./quiz');
const progressRoutes = require('./progress');
const notificationRoutes = require('./notification');
const { success } = require('../utils/response');

router.get('/health', (req, res) => success(res, null, 'Learning Module System API is running'));

router.use(enrollmentRoutes);
router.use(assignmentRoutes);
router.use(attemptAnswersRoutes);
router.use(adaptiveRoutes);
router.use(discussionRoutes);
router.use(quizRoutes);
router.use('/progress', progressRoutes);
router.use('/notifications', notificationRoutes);
router.use('/auth', require('./auth'));
router.use('/users', require('./user'));

module.exports = router;