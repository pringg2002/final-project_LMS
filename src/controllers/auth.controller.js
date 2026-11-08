const authService = require('../services/auth.service');
const { success, created } = require('../utils/response');

exports.register = async (req, res) => {
  const data = await authService.register(req.body);

  created(
    res,
    data,
    'Registered successfully'
  );
};

exports.login = async (req, res) => {
  const data = await authService.login(req.body);

  success(
    res,
    data,
    'Login successful'
  );
};

exports.changePassword = async (req, res) => {
  const data = await authService.changePassword(
    req.user.user_id,
    req.body.current_password,
    req.body.new_password
  );

  success(
    res,
    data,
    'Password changed successfully'
  );
};

exports.me = async (req, res) => {
  const user = await authService.me(
    req.user.user_id
  );

  success(
    res,
    user,
    'Current user retrieved successfully'
  );
};