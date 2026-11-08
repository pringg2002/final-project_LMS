const db = require('../db');
const { updateById, deleteById } = require('../utils/sql');

const COLS = 'assignment_id, module_id, created_by, title, instructions, due_date, max_score, status, created_at, updated_at';

async function findByModule(moduleId, { publishedOnly = false } = {}) {
  const [rows] = await db.query(
    `SELECT ${COLS} FROM assignments WHERE module_id = ? ${publishedOnly ? "AND status IN ('published','closed')" : ''}
     ORDER BY due_date IS NULL, due_date, assignment_id`,
    [moduleId]
  );
  return rows;
}

async function findById(assignmentId) {
  const [rows] = await db.query(`SELECT ${COLS} FROM assignments WHERE assignment_id = ?`, [assignmentId]);
  return rows[0] || null;
}

async function create({ module_id, created_by, title, instructions = null, due_date = null, max_score = 100, status = 'draft' }) {
  const [result] = await db.query(
    `INSERT INTO assignments (module_id, created_by, title, instructions, due_date, max_score, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [module_id, created_by, title, instructions, due_date, max_score, status]
  );
  return result.insertId;
}

const UPDATABLE = ['title', 'instructions', 'due_date', 'max_score', 'status'];
const update = (assignmentId, fields) => updateById('assignments', 'assignment_id', assignmentId, fields, UPDATABLE);
const remove = (assignmentId) => deleteById('assignments', 'assignment_id', assignmentId);

async function getAssignmentsWithoutSubmissionsReport() {
  const [rows] = await db.query(
    `SELECT a.assignment_id, a.title AS assignment_title, a.due_date, a.status AS assignment_status,
            m.module_id, m.title AS module_title, c.course_id, c.course_code
     FROM assignments a
     LEFT JOIN submissions s ON s.assignment_id = a.assignment_id
     INNER JOIN modules m ON m.module_id = a.module_id
     INNER JOIN courses c ON c.course_id = m.course_id
     WHERE s.submission_id IS NULL
     ORDER BY c.course_code, a.due_date`
  );
  return rows;
}

module.exports = { findByModule, findById, create, update, remove, getAssignmentsWithoutSubmissionsReport };
