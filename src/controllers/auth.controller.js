const authService = require('../services/auth.service');
const { success, created } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

exports.register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  created(res, data, 'Registered successfully');
});

exports.login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  success(res, data, 'Login successful');
});

exports.me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user.user_id);
  success(res, user, 'Current user retrieved successfully');
});