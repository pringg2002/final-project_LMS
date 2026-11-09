lesson.models.js



const db = require('../db');
const { updateById, deleteById } = require('../utils/sql');

const LIST_COLS =
  'lesson_id, module_id, title, lesson_order, estimated_minutes, status, created_at, updated_at';
const ALL_COLS = `${LIST_COLS.replace('title,', 'title, content,')}`;

async function findByModule(moduleId, { publishedOnly = false } = {}) {
  const [rows] = await db.query(
    `SELECT ${LIST_COLS} FROM lessons WHERE module_id = ? ${publishedOnly ? "AND status = 'published'" : ''}
     ORDER BY lesson_order, lesson_id`,
    [moduleId]
  );
  return rows;
}

async function findById(lessonId) {
  const [rows] = await db.query(`SELECT ${ALL_COLS} FROM lessons WHERE lesson_id = ?`, [lessonId]);
  return rows[0] || null;
}

async function nextOrder(moduleId) {
  const [rows] = await db.query('SELECT COALESCE(MAX(lesson_order), 0) + 1 AS next FROM lessons WHERE module_id = ?', [
    moduleId,
  ]);
  return Number(rows[0].next);
}

async function create({ module_id, title, content = null, lesson_order, estimated_minutes = null, status = 'draft' }) {
  const [result] = await db.query(
    `INSERT INTO lessons (module_id, title, content, lesson_order, estimated_minutes, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [module_id, title, content, lesson_order, estimated_minutes, status]
  );
  return result.insertId;
}

const UPDATABLE = ['title', 'content', 'lesson_order', 'estimated_minutes', 'status'];
const update = (lessonId, fields) => updateById('lessons', 'lesson_id', lessonId, fields, UPDATABLE);
const remove = (lessonId) => deleteById('lessons', 'lesson_id', lessonId);


async function getLessonsWithoutResourcesReport() {
  const [rows] = await db.query(
    `SELECT l.lesson_id, l.title AS lesson_title, l.status AS lesson_status,
            m.module_id, m.title AS module_title, c.course_id, c.course_code
     FROM lessons l
     LEFT JOIN lesson_resources lr ON lr.lesson_id = l.lesson_id
     INNER JOIN modules m ON m.module_id = l.module_id
     INNER JOIN courses c ON c.course_id = m.course_id
     WHERE lr.resource_id IS NULL
     ORDER BY c.course_code, m.module_order, l.lesson_order`
  );
  return rows;
}

module.exports = { findByModule, findById, nextOrder, create, update, remove, getLessonsWithoutResourcesReport };


