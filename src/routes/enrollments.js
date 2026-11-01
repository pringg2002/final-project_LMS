const express = require('express');
const router = express.Router();
const { getEnrollmentsByUser, createEnrollment, getEnrollmentActivity } = require('../controllers/enrollmentController');


router.get('/activity-report', getEnrollmentActivity);
router.get('/user/:user_id', getEnrollmentsByUser);
router.post('/', createEnrollment);

module.exports = router;