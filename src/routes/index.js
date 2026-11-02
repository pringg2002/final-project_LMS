const express = require('express');
const router = express.Router();
const enrollmentRoutes = require('./enrollments');
const assignmentRoutes = require('./assignment');         
const attemptAnswersRoutes = require('./attemptAnswer');  
const { success } = require('../utils/response');

router.get('/health', (req, res) => success(res, null, 'Learning Module System API is running'));

router.use('/enrollments', require ('./enrollments'));
router.use('/assignments', require('./assignments'));
router.use('/attempt-answers', require('./attemptAnswers'));
router.use('/auth', require('./auth'));
router.use('/users', require('./user'));

module.exports = router;