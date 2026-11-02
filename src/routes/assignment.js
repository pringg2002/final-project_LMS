const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');

// Assignment routes stub
router.get('/', auth, asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Assignments endpoint working' });
}));

module.exports = router;