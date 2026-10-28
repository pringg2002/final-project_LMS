const express = require('express');
const router = express.Router();
const { getAnnouncementsByCourse, createAnnouncement } = require('../controllers/announcementsController');

router.get('/:course_id', getAnnouncementsByCourse);
router.post('/', createAnnouncement);

module.exports = router;