const db = require('../db');
const { updateById, deleteById } = require('../utils/sql');

const COLS = 'resource_id, lesson_id, title, resource_type, resource_url, description, created_at';

async function findByLesson(lessonId) {
  const [rows] = await db.query(`SELECT ${COLS} FROM lesson_resources WHERE lesson_id = ? ORDER BY resource_id`, [lessonId]);
  return rows;
}

async function findById(resourceId) {
  const [rows] = await db.query(`SELECT ${COLS} FROM lesson_resources WHERE resource_id = ?`, [resourceId]);
  return rows[0] || null;
}

async function create({ lesson_id, title, resource_type = 'link', resource_url, description = null }) {
  const [result] = await db.query(
    'INSERT INTO lesson_resources (lesson_id, title, resource_type, resource_url, description) VALUES (?, ?, ?, ?, ?)',
    [lesson_id, title, resource_type, resource_url, description]
  );
  return result.insertId;
}

const UPDATABLE = ['title', 'resource_type', 'resource_url', 'description'];
const update = (resourceId, fields) => updateById('lesson_resources', 'resource_id', resourceId, fields, UPDATABLE);
const remove = (resourceId) => deleteById('lesson_resources', 'resource_id', resourceId);

module.exports = { findByLesson, findById, create, update, remove };
