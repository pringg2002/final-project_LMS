const userModel = require('../models/user.models');
const roleModel = require('../models/role.models');
const { hashPassword, comparePassword } = require('../lib/password');
const { signToken } = require('../lib/token');
const { ROLES } = require('../lib/roles');
const {
  isEmail,
  requireFields,
  validatePassword
} = require('../lib/validate');
const AppError = require('../utils/AppError');

async function register({
  first_name,
  last_name,
  email,
  password
}) {
  requireFields(
    { first_name, last_name, email, password },
    ['first_name', 'last_name', 'email', 'password']
  );

  if (!isEmail(email)) {
    throw new AppError('Invalid email address', 400);
  }

  validatePassword(password);

  const normalizedEmail = email.trim().toLowerCase();

  const studentRole = await roleModel.findByName(
    ROLES.STUDENT
  );

  if (!studentRole) {
    throw new AppError(
      'Student role is missing - run database/seed.sql',
      500
    );
  }

  const userId = await userModel.create({
    role_id: studentRole.role_id,
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    email: normalizedEmail,
    password_hash: await hashPassword(password)
  });

  const user = await userModel.findById(userId);

  return {
    user,
    token: signToken(user)
  };
}

async function login({ email, password }) {
  requireFields(
    { email, password },
    ['email', 'password']
  );

  const row = await userModel.findByEmailWithPassword(
    String(email).trim().toLowerCase()
  );

  const invalid = new AppError(
    'Invalid email or password',
    401
  );

  if (!row) throw invalid;

  if (!(await comparePassword(
    password,
    row.password_hash
  ))) {
    throw invalid;
  }

  if (row.status !== 'active') {
    throw new AppError(
      'Account is inactive',
      403
    );
  }

  const user = await userModel.findById(row.user_id);

  return {
    user,
    token: signToken({
      ...user,
      token_version: row.token_version
    })
  };
}

async function me(userId) {
  const user = await userModel.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

async function changePassword(
  userId,
  currentPassword,
  newPassword
) {
  requireFields(
    { currentPassword, newPassword },
    ['currentPassword', 'newPassword']
  );

  validatePassword(newPassword);

  const user = await userModel.findByIdWithPassword(
    userId
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!(await comparePassword(
    currentPassword,
    user.password_hash
  ))) {
    throw new AppError(
      'Current password is incorrect',
      400
    );
  }

  if (await comparePassword(
    newPassword,
    user.password_hash
  )) {
    throw new AppError(
      'New password must be different',
      400
    );
  }

  await userModel.updatePassword(
    userId,
    await hashPassword(newPassword),
    false
  );

  const updated = await userModel.findById(userId);

  const tokenState = await userModel.findTokenState(
    userId
  );

  return {
    user: updated,
    token: signToken({
      ...updated,
      token_version: tokenState.token_version
    })
  };
}

module.exports = {
  register,
  login,
  me,
  changePassword
};