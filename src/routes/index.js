const router = require('express').Router();
const { success } = require('../utils/response');

router.get('/health', (req, res) => success(res, null, 'Learning Module API is running'));

router.use('/auth', require('./auth'));
router.use('/users', require('./user'));
router.use('/notifications', require('./notification'));
router.use('/reports', require('./report'));
router.use(require('./course'));
router.use(require('./module'));
router.use(require('./lesson'));
router.use(require('./quiz'));
router.use(require('./assignment'));
router.use(require('./discussion'));
router.use(require('./adaptive'));
router.use(require('./enrollments'));
router.use(require('./attemptAnswer'));

module.exports = router;