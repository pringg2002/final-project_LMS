const db = require('../db');

const COLUMNS =
  'notification_id, user_id, title, message, notification_type, reference_id, is_read, created_at';

async function create({ user_id, title, message, notification_type = 'system', reference_id = null }) {
  const [result] = await db.query(
    `INSERT INTO notifications (user_id, title, message, notification_type, reference_id)
     VALUES (?, ?, ?, ?, ?)`,
    [user_id, title, message, notification_type, reference_id]
  );
  return result.insertId;
}

async function findByUser(userId, { unreadOnly = false } = {}) {
  const [rows] = await db.query(
    `SELECT ${COLUMNS} FROM notifications
     WHERE user_id = ? ${unreadOnly ? 'AND is_read = 0' : ''}
     ORDER BY created_at DESC, notification_id DESC`,
    [userId]
  );
  return rows;
}

async function findById(notificationId) {
  const [rows] = await db.query(`SELECT ${COLUMNS} FROM notifications WHERE notification_id = ?`, [
    notificationId,
  ]);
  return rows[0] || null;
}

async function markRead(notificationId) {
  const [result] = await db.query('UPDATE notifications SET is_read = 1 WHERE notification_id = ?', [
    notificationId,
  ]);
  return result.affectedRows;
}

async function markAllRead(userId) {
  const [result] = await db.query(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return result.affectedRows;
}

async function remove(notificationId) {
  const [result] = await db.query('DELETE FROM notifications WHERE notification_id = ?', [notificationId]);
  return result.affectedRows;
}

async function exists({ user_id, notification_type, reference_id, title }) {
  const [rows] = await db.query(
    'SELECT 1 FROM notifications WHERE user_id = ? AND notification_type = ? AND reference_id = ? AND title = ? LIMIT 1',
    [user_id, notification_type, reference_id, title]
  );
  return rows.length > 0;
}

module.exports = {
    exists,
    create,
    findByUser,
    findById,
    markRead,
    markAllRead,
    remove
};
