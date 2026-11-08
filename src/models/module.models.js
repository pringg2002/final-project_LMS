const db = require('../db');
const { updateById, deleteById } = require('../utils/sql');

const COLS =
  'module_id, course_id, title, description, module_order, passing_score, status, created_at, updated_at';

async function findByCourse(courseId, { publishedOnly = false } = {}) {
  const [rows] = await db.query(
    `SELECT ${COLS} FROM modules WHERE course_id = ? ${publishedOnly ? "AND status = 'published'" : ''}
     ORDER BY module_order, module_id`,
    [courseId]
  );
  return rows;
}

async function findById(moduleId) {
  const [rows] = await db.query(`SELECT ${COLS} FROM modules WHERE module_id = ?`, [moduleId]);
  return rows[0] || null;
}

async function nextOrder(courseId) {
  const [rows] = await db.query('SELECT COALESCE(MAX(module_order), 0) + 1 AS next FROM modules WHERE course_id = ?', [
    courseId,
  ]);
  return Number(rows[0].next);
}

async function create({ course_id, title, description = null, module_order, passing_score = 75, status = 'draft' }) {
  const [result] = await db.query(
    `INSERT INTO modules (course_id, title, description, module_order, passing_score, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [course_id, title, description, module_order, passing_score, status]
  );
  return result.insertId;
}

const UPDATABLE = ['title', 'description', 'module_order', 'passing_score', 'status'];
const update = (moduleId, fields) => updateById('modules', 'module_id', moduleId, fields, UPDATABLE);
const remove = (moduleId) => deleteById('modules', 'module_id', moduleId);

module.exports = { findByCourse, findById, nextOrder, create, update, remove };