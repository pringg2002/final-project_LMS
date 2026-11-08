const router = require('express').Router();
const moduleController = require('../controllers/module.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../lib/roles');

const staff = role(ROLES.ADMIN, ROLES.INSTRUCTOR);

router.get('/modules/:id', auth, asyncHandler(moduleController.get));
router.put('/modules/:id', auth, staff, asyncHandler(moduleController.update));
router.delete('/modules/:id', auth, staff, asyncHandler(moduleController.remove));

router.get('/modules/:moduleId/prerequisites', auth, asyncHandler(moduleController.listPrerequisites));
router.post('/modules/:moduleId/prerequisites', auth, staff, asyncHandler(moduleController.addPrerequisite));
router.delete('/prerequisites/:id', auth, staff, asyncHandler(moduleController.removePrerequisite));

module.exports = router;