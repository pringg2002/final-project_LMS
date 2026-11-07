const userService = require('../services/user.service');
const { parseId } = require('../lib/validate');
const { success, created } = require('../utils/response');

exports.list = async (req, res) => {
  success(
    res,
    await userService.list(),
    'Users retrieved successfully'
  );
};

exports.listStudents = async (req, res) => {
  success(
    res,
    await userService.listStudents(req.user),
    'Students retrieved successfully'
  );
};

exports.get = async (req, res) => {
  const user = await userService.getById(
    parseId(req.params.id),
    req.user
  );

  success(
    res,
    user,
    'User retrieved successfully'
  );
};

exports.create = async (req, res) => {
  created(
    res,
    await userService.create(req.body),
    'User created successfully'
  );
};

exports.update = async (req, res) => {
  const user = await userService.update(
    parseId(req.params.id),
    req.body,
    req.user
  );

  success(
    res,
    user,
    'User updated successfully'
  );
};

exports.resetPassword = async (req, res) => {
  const data = await userService.resetPassword(
    parseId(req.params.id),
    req.body.password,
    req.user
  );

  success(
    res,
    data,
    'Password reset successfully'
  );
};

exports.remove = async (req, res) => {
  await userService.remove(
    parseId(req.params.id),
    req.user
  );

  success(
    res,
    null,
    'User deleted successfully'
  );
};