const userModel = require('../models/user.models');
const { randomBytes } = require('node:crypto');
const roleModel = require('../models/role.models');
const { hashPassword } = require('../lib/password');
const { ROLES } = require('../lib/roles');
const {
  isEmail,
  requireFields,
  validatePassword
} = require('../lib/validate');
const AppError = require('../utils/AppError');

const STATUSES = ['active', 'inactive'];

async function resolveRoleId({ role_id, role }) {
  if (role_id !== undefined) {
    const found = await roleModel.findById(role_id);

    if (!found) {
      throw new AppError('Role does not exist', 400);
    }

    return found.role_id;
  }

  if (role !== undefined) {
    const found = await roleModel.findByName(role);

    if (!found) {
      throw new AppError('Role does not exist', 400);
    }

    return found.role_id;
  }

  return undefined;
}

const isAdmin = actor => actor.role === ROLES.ADMIN;

function assertSelfOrAdmin(actor, targetId) {
  if (!isAdmin(actor) && actor.user_id !== targetId) {
    throw new AppError(
      'You can only access your own account',
      403
    );
  }
}

const list = () => userModel.findAll();

const listStudents = actor =>
  actor.role === ROLES.ADMIN
    ? userModel.findStudents()
    : userModel.findStudentsByInstructor(actor.user_id);

async function getById(id, actor) {
  assertSelfOrAdmin(actor, id);

  const user = await userModel.findById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

async function create(body) {
  requireFields(
    body,
    ['first_name', 'last_name', 'email']
  );

  const temporaryPassword =
    randomBytes(18).toString('base64url') + '9a';

  if (!isEmail(body.email)) {
    throw new AppError('Invalid email address', 400);
  }

  validatePassword(temporaryPassword);

  const role_id =
    (await resolveRoleId(body)) ??
    (await roleModel.findByName(ROLES.STUDENT)).role_id;

  if (
    body.status !== undefined &&
    !STATUSES.includes(body.status)
  ) {
    throw new AppError(
      `status must be one of: ${STATUSES.join(', ')}`,
      400
    );
  }

  const middleName =
    typeof body.middle_name === 'string'
      ? body.middle_name.trim() || null
      : null;

  const id = await userModel.create({
    role_id,
    first_name: body.first_name.trim(),
    middle_name: middleName,
    last_name: body.last_name.trim(),
    email: body.email.trim().toLowerCase(),
    password_hash: await hashPassword(temporaryPassword),
    status: body.status,
    must_change_password: true
  });

  return {
    ...(await userModel.findById(id)),
    temporary_password: temporaryPassword
  };
}

async function update(id, body, actor) {
  assertSelfOrAdmin(actor, id);

  const existing = await userModel.findById(id);

  if (!existing) {
    throw new AppError('User not found', 404);
  }

  const fields = {};

  if (body.first_name !== undefined) {
    fields.first_name = String(body.first_name).trim();
  }

  if (body.middle_name !== undefined) {
    fields.middle_name =
      body.middle_name === null
        ? null
        : String(body.middle_name).trim() || null;
  }

  if (body.last_name !== undefined) {
    fields.last_name = String(body.last_name).trim();
  }

  if (body.email !== undefined) {
    if (!isEmail(body.email)) {
      throw new AppError('Invalid email address', 400);
    }

    fields.email = body.email.trim().toLowerCase();
  }

  if (body.password !== undefined) {
    throw new AppError(
      'Use the password change or admin reset endpoint',
      400
    );
  }

  const wantsPrivileged = [
    'role_id',
    'role',
    'status'
  ].some(key => body[key] !== undefined);

  if (wantsPrivileged) {
    if (!isAdmin(actor)) {
      throw new AppError(
        'Only an admin can change role or status',
        403
      );
    }

    const role_id = await resolveRoleId(body);

    if (role_id !== undefined) {
      fields.role_id = role_id;
    }

    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) {
        throw new AppError(
          `status must be one of: ${STATUSES.join(', ')}`,
          400
        );
      }

      fields.status = body.status;
    }

    if (
      actor.user_id === id &&
      (
        fields.status === 'inactive' ||
        (
          fields.role_id &&
          fields.role_id !== existing.role_id
        )
      )
    ) {
      throw new AppError(
        'Admins cannot deactivate or demote themselves',
        400
      );
    }
  }

  if (!Object.keys(fields).length) {
    throw new AppError(
      'No valid fields to update',
      400
    );
  }

  await userModel.update(id, fields);

  if (
    fields.role_id !== undefined &&
    fields.role_id !== existing.role_id
  ) {
    await userModel.bumpTokenVersion(id);
  }

  return userModel.findById(id);
}

async function resetPassword(id, password, actor) {
  if (!isAdmin(actor)) {
    throw new AppError(
      'Only admins can reset passwords',
      403
    );
  }

  if (id === actor.user_id) {
    throw new AppError(
      'Use Change Password for your own account',
      400
    );
  }

  validatePassword(password);

  const existing = await userModel.findById(id);

  if (!existing) {
    throw new AppError(
      'User not found',
      404
    );
  }

  await userModel.updatePassword(
    id,
    await hashPassword(password),
    true
  );

  return {
    message:
      'Temporary password assigned. User must change it on next login.'
  };
}

async function remove(id, actor) {
  if (actor.user_id === id) {
    throw new AppError(
      'You cannot delete your own account',
      400
    );
  }

  const affected = await userModel.remove(id);

  if (!affected) {
    throw new AppError(
      'User not found',
      404
    );
  }
}


const rolesReport = () =>
  userModel.getUsersWithRolesReport();


module.exports = {
  list,
  listStudents,
  getById,
  create,
  update,
  resetPassword,
  remove,
  rolesReport
};