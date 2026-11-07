const router = require('express').Router();
const lessonController = require('../controllers/lesson.controller');
const progressController = require('../controllers/progress.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../lib/roles');

const staff = role(ROLES.ADMIN, ROLES.INSTRUCTOR);
const student = role(ROLES.STUDENT);

router.get('/modules/:moduleId/lessons', auth, asyncHandler(lessonController.listByModule));
router.post('/modules/:moduleId/lessons', auth, staff, asyncHandler(lessonController.createInModule));
router.get('/lessons/:id', auth, asyncHandler(lessonController.get));
router.put('/lessons/:id', auth, staff, asyncHandler(lessonController.update));
router.delete('/lessons/:id', auth, staff, asyncHandler(lessonController.remove));

router.get('/lessons/:lessonId/resources', auth, asyncHandler(lessonController.listResources));
router.post('/lessons/:lessonId/resources', auth, staff, asyncHandler(lessonController.createResource));
router.put('/resources/:id', auth, staff, asyncHandler(lessonController.updateResource));
router.delete('/resources/:id', auth, staff, asyncHandler(lessonController.removeResource));

router.get('/progress/me', auth, asyncHandler(progressController.mine));
router.get('/lessons/:lessonId/progress', auth, asyncHandler(progressController.forLesson));
router.post('/progress', auth, student, asyncHandler(progressController.record));
router.put('/progress/:id', auth, student, asyncHandler(progressController.update));

module.exports = router;
