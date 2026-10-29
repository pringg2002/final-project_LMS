const userModel = require('../models/user.models');
const roleModel = require('../models/role.models');
const { hashPassword } = require('../lib/password');
const { ROLES } = require('../lib/roles');
const { isEmail, requireFields, validatePassword } = require('../lib/validate');
const AppError = require('../utils/AppError');

const STATUSES = ['active', 'inactive'];

async function resolveRoleId({ role_id, role }) {
  if (role_id !== undefined) {
    const found = await roleModel.findById(role_id);
    if (!found) throw new AppError('Role does not exist', 400);
    return found.role_id;
  }
  if (role !== undefined) {
    const found = await roleModel.findByName(role);
    if (!found) throw new AppError('Role does not exist', 400);
    return found.role_id;
  }
  return undefined;
}

const isAdmin = (actor) => actor.role === ROLES.ADMIN;

function assertSelfOrAdmin(actor, targetId) {
  if (!isAdmin(actor) && actor.user_id !== targetId) {
    throw new AppError('You can only access your own account', 403);
  }
}

const list = () => userModel.findAll();

async function getById(id, actor) {
  assertSelfOrAdmin(actor, id);
  const user = await userModel.findById(id);
  if (!user) throw new AppError('User not found', 404);
  return user;
}

async function create(body) {
  requireFields(body, ['first_name', 'last_name', 'email', 'password']);
  if (!isEmail(body.email)) throw new AppError('Invalid email address', 400);
  validatePassword(body.password);

  const role_id = (await resolveRoleId(body)) ?? (await roleModel.findByName(ROLES.STUDENT)).role_id;
  if (body.status !== undefined && !STATUSES.includes(body.status)) {
    throw new AppError(`status must be one of: ${STATUSES.join(', ')}`, 400);
  }

  const id = await userModel.create({
    role_id,
    first_name: body.first_name.trim(),
    last_name: body.last_name.trim(),
    email: body.email.trim().toLowerCase(),
    password_hash: await hashPassword(body.password),
    status: body.status,
  });
  return userModel.findById(id);
}

async function update(id, body, actor) {
  assertSelfOrAdmin(actor, id);
  const existing = await userModel.findById(id);
  if (!existing) throw new AppError('User not found', 404);

  const fields = {};
  if (body.first_name !== undefined) fields.first_name = String(body.first_name).trim();
  if (body.last_name !== undefined) fields.last_name = String(body.last_name).trim();
  if (body.email !== undefined) {
    if (!isEmail(body.email)) throw new AppError('Invalid email address', 400);
    fields.email = body.email.trim().toLowerCase();
  }
  if (body.password !== undefined) {
    validatePassword(body.password);
    fields.password_hash = await hashPassword(body.password);
  }

  const wantsPrivileged = ['role_id', 'role', 'status'].some((k) => body[k] !== undefined);
  if (wantsPrivileged) {
    if (!isAdmin(actor)) throw new AppError('Only an admin can change role or status', 403);
    const role_id = await resolveRoleId(body);
    if (role_id !== undefined) fields.role_id = role_id;
    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) {
        throw new AppError(`status must be one of: ${STATUSES.join(', ')}`, 400);
      }
      fields.status = body.status;
    }
    if (actor.user_id === id && (fields.status === 'inactive' || (fields.role_id && fields.role_id !== existing.role_id))) {
      throw new AppError('Admins cannot deactivate or demote themselves', 400);
    }
  }

  if (!Object.keys(fields).length) throw new AppError('No valid fields to update', 400);
  await userModel.update(id, fields);
  return userModel.findById(id);
}

async function remove(id, actor) {
  if (actor.user_id === id) throw new AppError('You cannot delete your own account', 400);
  const affected = await userModel.remove(id); // FK in use -> ER_ROW_IS_REFERENCED_2 -> 409
  if (!affected) throw new AppError('User not found', 404);
}

const rolesReport = () => userModel.getUsersWithRolesReport();

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  rolesReport
};
