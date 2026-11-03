const db = require('../db');
const { updateById, deleteById } = require('../utils/sql');

const BASE = `
  SELECT c.course_id, c.course_code, c.course_name, c.description, c.instructor_id, c.status,
         c.created_at, c.updated_at, CONCAT(u.first_name, ' ', u.last_name) AS instructor_name
  FROM courses c
  INNER JOIN users u ON u.user_id = c.instructor_id`;

async function findAll(scope = { publishedOnly: true }) {
  let where = '';
  const params = [];
  if (scope.publishedOnly) where = "WHERE c.status = 'published'";
  else if (scope.publishedOrOwnedBy) {
    where = "WHERE c.status = 'published' OR c.instructor_id = ?";
    params.push(scope.publishedOrOwnedBy);
  }
  const [rows] = await db.query(`${BASE} ${where} ORDER BY c.course_code`, params);
  return rows;
}

async function findById(courseId) {
  const [rows] = await db.query(`${BASE} WHERE c.course_id = ?`, [courseId]);
  return rows[0] || null;
}

async function create({ course_code, course_name, description = null, instructor_id, status = 'draft' }) {
  const [result] = await db.query(
    `INSERT INTO courses (course_code, course_name, description, instructor_id, status)
     VALUES (?, ?, ?, ?, ?)`,
    [course_code, course_name, description, instructor_id, status]
  );
  return result.insertId;
}

const UPDATABLE = ['course_code', 'course_name', 'description', 'instructor_id', 'status'];
const update = (courseId, fields) => updateById('courses', 'course_id', courseId, fields, UPDATABLE);
const remove = (courseId) => deleteById('courses', 'course_id', courseId);

async function getCourseModulesReport() {
  const [rows] = await db.query(
    `SELECT c.course_id, c.course_code, c.course_name,
            m.module_id, m.title AS module_title, m.module_order,
            m.passing_score, m.status AS module_status
     FROM courses c
     INNER JOIN modules m ON m.course_id = c.course_id
     ORDER BY c.course_code, m.module_order`
  );
  return rows;
}

module.exports = { findAll, findById, create, update, remove, getCourseModulesReport };
