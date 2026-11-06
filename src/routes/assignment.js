const router = require('express').Router();
const controller = require('../controllers/assignment.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../lib/roles');

const staff = role(ROLES.ADMIN, ROLES.INSTRUCTOR);
const student = role(ROLES.STUDENT);

router.get('/modules/:moduleId/assignments', auth, asyncHandler(controller.listByModule));
router.post('/modules/:moduleId/assignments', auth, staff, asyncHandler(controller.createInModule));
router.get('/assignments/:id', auth, asyncHandler(controller.get));
router.put('/assignments/:id', auth, staff, asyncHandler(controller.update));
router.delete('/assignments/:id', auth, staff, asyncHandler(controller.remove));

router.get('/assignments/:assignmentId/submissions', auth, asyncHandler(controller.listSubmissions));
router.post('/assignments/:assignmentId/submissions', auth, student, asyncHandler(controller.createSubmission));
router.get('/submissions/:id', auth, asyncHandler(controller.getSubmission));
router.put('/submissions/:id', auth, asyncHandler(controller.updateSubmission));
router.delete('/submissions/:id', auth, asyncHandler(controller.removeSubmission));

module.exports = router;