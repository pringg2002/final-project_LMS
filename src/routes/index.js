<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const enrollmentRoutes = require('./enrollments');

router.use('/enrollments', enrollmentRoutes);
=======
const router = require('express').Router();
const { success } = require('../utils/response');

router.get('/health', (req, res) => success(res, null, 'Learning Module API is running'));

router.use('/auth', require('./auth'));
router.use('/users', require('./user'));

>>>>>>> origin/main

module.exports = router;