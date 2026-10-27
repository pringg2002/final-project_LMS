const userModel = require('../models/users.model');
const { success, created } = require('../utils/response');
const AppError = require('../utils/AppError');
const { parseId, isEmail } = require('../lib/validate');


async function getAll(req, res) {
  const users = await userModel.findAll();
  return success(res, users, 'Users retrieved successfully');
}

async function getById(req, res) {
  const userId = parseId(req.params.id, 'user ID');
  const user = await userModel.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }
  return success(res, user, 'User retrieved successfully');
}

async function create(req, res) {
  const {
    role_id,
    first_name,
    middle_name,
    last_name,
    email,
    password_hash,
    status
  } = req.body;

  if (
    !role_id ||
    !first_name ||
    !last_name ||
    !email ||
    !password_hash
  ) {
    throw new AppError(
      'role_id, first_name, last_name, email, and password_hash are required',
      400);
  }

  if (!isEmail(email)) {
    throw new AppError('Invalid email address', 400);
  }

  const userId = await userModel.create({
    role_id,
    first_name: first_name.trim(),
    middle_name: middle_name || null,
    last_name: last_name.trim(),
    email: email.trim().toLowerCase(),
    password_hash,
    status: status || 'active'
  });

  const user = await userModel.findById(userId);
  return created(res, user,'User created successfully');
}

async function update(req, res) {
  const userId = parseId(req.params.id, 'user ID');

  const fields = { ...req.body };

  if (fields.email !== undefined) {
    if (!isEmail(fields.email)) {
      throw new AppError('Invalid email address', 400);
    }

    fields.email = fields.email.trim().toLowerCase();
  }

  if (fields.first_name !== undefined) {
    fields.first_name = fields.first_name.trim();
  }

  if (fields.middle_name !== undefined) {
    fields.middle_name =
      fields.middle_name === ''
        ? null
        : fields.middle_name.trim();
  }

  if (fields.last_name !== undefined) {
    fields.last_name = fields.last_name.trim();
  }

  const affectedRows = await userModel.update(userId, fields);

  if (!affectedRows) {
    throw new AppError('User not found or nothing was changed', 404);
  }

  const user = await userModel.findById(userId);

  return success(res,nuser, 'User updated successfully');
}

async function remove(req, res) {
  const userId = parseId(req.params.id, 'user ID');
  const affectedRows = await userModel.remove(userId);

  if (!affectedRows) {
    throw new AppError('User not found', 404);
  }
  return success(res, null, 'User deleted successfully');
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};