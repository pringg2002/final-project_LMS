const router = require('express').Router();
const { success } = require('../utils/response');

router.get('/health', (req, res) => success(res, null, 'Learning Module API is running'));

router.use('/auth', require('./auth'));
router.use('/users', require('./user'));


module.exports = router;