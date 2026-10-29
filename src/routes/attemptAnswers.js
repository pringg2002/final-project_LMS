const express = require('express');
const router = express.Router();
const { getAttemptAnswers, createAttemptAnswer } = require('../controllers/attemptAnswersController');

router.get('/:attempt_id', getAttemptAnswers);
router.post('/', createAttemptAnswer);

module.exports = router;