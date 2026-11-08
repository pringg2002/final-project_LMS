const router = require('express').Router();
const controller = require('../controllers/discussion.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { ROLES } = require('../lib/roles');
const learner = role(ROLES.INSTRUCTOR, ROLES.STUDENT);
const asyncHandler = require('../utils/asyncHandler');

router.get('/modules/:moduleId/discussions', auth, learner, asyncHandler(controller.listByModule));
router.post('/modules/:moduleId/discussions', auth, learner, asyncHandler(controller.createInModule));
router.get('/discussions/:id', auth, learner, asyncHandler(controller.get));
router.put('/discussions/:id', auth, learner, asyncHandler(controller.update));
router.delete('/discussions/:id', auth, learner, asyncHandler(controller.remove));

router.get('/discussions/:discussionId/replies', auth, learner, asyncHandler(controller.listReplies));
router.post('/discussions/:discussionId/replies', auth, learner, asyncHandler(controller.createReply));
router.put('/replies/:id', auth, learner, asyncHandler(controller.updateReply));
router.delete('/replies/:id', auth, learner, asyncHandler(controller.removeReply));

module.exports = router;