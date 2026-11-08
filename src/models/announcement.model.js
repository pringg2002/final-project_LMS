const db = require('../db');
const { updateById, deleteById } = require('../utils/sql');

const BASE = `
  SELECT a.announcement_id, a.course_id, a.author_id, a.title, a.content, a.published_at, a.expires_at,
         a.status, a.created_at, CONCAT(u.first_name, ' ', u.last_name) AS author_name
  FROM announcements a
  INNER JOIN users u ON u.user_id = a.author_id`;


async function findByCourse(courseId, { visibleOnly = false } = {}) {
  const [rows] = await db.query(
    `${BASE} WHERE a.course_id = ?
     ${visibleOnly ? "AND a.status = 'published' AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)" : ''}
     ORDER BY COALESCE(a.published_at, a.created_at) DESC, a.announcement_id DESC`,
    [courseId]
  );
  return rows;
}

async function findById(announcementId) {
  const [rows] = await db.query(`${BASE} WHERE a.announcement_id = ?`, [announcementId]);
  return rows[0] || null;
}

async function create({ course_id, author_id, title, content, status, published_at = null, expires_at = null }) {
  const [result] = await db.query(
    `INSERT INTO announcements (course_id, author_id, title, content, status, published_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [course_id, author_id, title, content, status, published_at, expires_at]
  );
  return result.insertId;
}

const UPDATABLE = ['title', 'content', 'status', 'published_at', 'expires_at'];
const update = (id, fields) => updateById('announcements', 'announcement_id', id, fields, UPDATABLE);
const remove = (id) => deleteById('announcements', 'announcement_id', id);

module.exports = { findByCourse, findById, create, update, remove };