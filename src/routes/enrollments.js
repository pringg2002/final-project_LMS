const express = require('express');
const router = express.Router();
const { getEnrollmentsByUser, createEnrollment } = require('../controllers/enrollmentController');

router.get('/user/:user_id', getEnrollmentsByUser);
router.post('/', createEnrollment);

module.exports = router;