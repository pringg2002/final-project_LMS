const router = require('express').Router();
const controller = require('../controllers/discussion.controller');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.get('/modules/:moduleId/discussions', auth, asyncHandler(controller.listByModule));
router.post('/modules/:moduleId/discussions', auth, asyncHandler(controller.createInModule));
router.get('/discussions/:id', auth, asyncHandler(controller.get));
router.put('/discussions/:id', auth, asyncHandler(controller.update));
router.delete('/discussions/:id', auth, asyncHandler(controller.remove));

router.get('/discussions/:discussionId/replies', auth, asyncHandler(controller.listReplies));
router.post('/discussions/:discussionId/replies', auth, asyncHandler(controller.createReply));
router.put('/replies/:id', auth, asyncHandler(controller.updateReply));
router.delete('/replies/:id', auth, asyncHandler(controller.removeReply));
module.exports = router;
