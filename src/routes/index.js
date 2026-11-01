const express = require('express');
const router = express.Router();
const enrollmentRoutes = require('./enrollments');

router.use('/enrollments', enrollmentRoutes);

module.exports = router;