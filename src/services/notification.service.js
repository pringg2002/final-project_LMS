const notificationModel = require('../models/notification.models');
const { ROLES } = require('../lib/roles');
const AppError = require('../utils/AppError');

const TYPES = ['announcement', 'progress', 'quiz', 'system'];

async function notify({ user_id, title, message, notification_type = 'system', reference_id = null }) {
  if (!TYPES.includes(notification_type)) {
    throw new AppError(`notification_type must be one of: ${TYPES.join(', ')}`, 400);
  }
  const id = await notificationModel.create({ user_id, title, message, notification_type, reference_id });
  return notificationModel.findById(id);
}

const listForUser = (userId, unreadOnly) => notificationModel.findByUser(userId, { unreadOnly });

async function loadOwned(id, actor) {
  const n = await notificationModel.findById(id);
  if (!n) throw new AppError('Notification not found', 404);
  if (n.user_id !== actor.user_id && actor.role !== ROLES.ADMIN) {
    throw new AppError('You can only access your own notifications', 403);
  }
  return n;
}

async function markRead(id, actor) {
  await loadOwned(id, actor);
  await notificationModel.markRead(id);
  return notificationModel.findById(id);
}

const markAllRead = (userId) => notificationModel.markAllRead(userId);

async function remove(id, actor) {
  await loadOwned(id, actor);
  await notificationModel.remove(id);
}

module.exports = {
  notify,
  listForUser,
  markRead,
  markAllRead,
  remove
};
