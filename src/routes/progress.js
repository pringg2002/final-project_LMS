const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progress.controller');

router.get('/:userId', progressController.getUserProgress);
router.post('/', progressController.updateProgress);

module.exports = router;