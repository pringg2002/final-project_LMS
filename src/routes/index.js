const express = require('express');
const router = express.Router();
const enrollmentRoutes = require('./enrollments');
const assignmentRoutes = require('./assignments');         
const attemptAnswersRoutes = require('./attemptAnswers');  
const { success } = require('../utils/response');

router.get('/health', (req, res) => success(res, null, 'Learning Module System API is running'));

router.use('/enrollments', enrollmentRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/attempt-answers', attemptAnswersRoutes);
router.use('/auth', require('./auth'));
router.use('/users', require('./user'));

module.exports = router;