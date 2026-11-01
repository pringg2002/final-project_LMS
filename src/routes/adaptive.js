const router = require('express').Router();
const controller = require('../controllers/adaptive.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../lib/roles');

const staff = role(ROLES.ADMIN, ROLES.INSTRUCTOR);

router.get('/modules/:id/access', auth, asyncHandler(controller.moduleAccess));
router.get('/courses/:courseId/progress', auth, asyncHandler(controller.courseProgress));

router.get('/modules/:moduleId/unlock-candidates', auth, staff, asyncHandler(controller.unlockCandidates));
router.get('/modules/:moduleId/unlocks', auth, staff, asyncHandler(controller.listUnlocks));
router.post('/modules/:moduleId/unlocks', auth, staff, asyncHandler(controller.grantUnlock));
router.delete('/modules/:moduleId/unlocks/:studentId', auth, staff, asyncHandler(controller.revokeUnlock));

module.exports = router;
