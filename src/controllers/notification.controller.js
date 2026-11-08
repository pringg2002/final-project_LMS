const notificationService = require('../services/notification.service');
const { parseId } = require('../lib/validate');
const { success } = require('../utils/response');

exports.list = async (req, res) => {
  const unreadOnly = req.query.unread === 'true';
  const rows = await notificationService.listForUser(req.user.user_id, unreadOnly);
  success(res, rows, 'Notifications retrieved successfully');
};

exports.markRead = async (req, res) => {
  const n = await notificationService.markRead(parseId(req.params.id), req.user);
  success(res, n, 'Notification marked as read');
};

exports.markAllRead = async (req, res) => {
  const updated = await notificationService.markAllRead(req.user.user_id);
  success(res, { updated }, 'All notifications marked as read');
};

exports.remove = async (req, res) => {
  await notificationService.remove(parseId(req.params.id), req.user);
  success(res, null, 'Notification deleted successfully');
};