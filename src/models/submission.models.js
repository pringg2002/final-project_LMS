const db = require('../db');
const { updateById, deleteById } = require('../utils/sql');

const BASE = `
  SELECT s.submission_id, s.assignment_id, s.student_id, s.submission_text, s.file_url, s.submitted_at,
         s.score, s.feedback, s.status, CONCAT(u.first_name, ' ', u.last_name) AS student_name
  FROM submissions s
  INNER JOIN users u ON u.user_id = s.student_id`;

async function findByAssignment(assignmentId, { studentId } = {}) {
  const [rows] = await db.query(
    `${BASE} WHERE s.assignment_id = ? ${studentId ? 'AND s.student_id = ?' : ''} ORDER BY s.submitted_at`,
    studentId ? [assignmentId, studentId] : [assignmentId]
  );
  return rows;
}

async function findById(submissionId) {
  const [rows] = await db.query(`${BASE} WHERE s.submission_id = ?`, [submissionId]);
  return rows[0] || null;
}

async function findByStudentAssignment(studentId, assignmentId) {
  const [rows] = await db.query(`${BASE} WHERE s.student_id = ? AND s.assignment_id = ?`, [studentId, assignmentId]);
  return rows[0] || null;
}

async function create({ assignment_id, student_id, submission_text = null, file_url = null, status = 'submitted' }) {
  const [result] = await db.query(
    'INSERT INTO submissions (assignment_id, student_id, submission_text, file_url, status) VALUES (?, ?, ?, ?, ?)',
    [assignment_id, student_id, submission_text, file_url, status]
  );
  return result.insertId;
}

const UPDATABLE = ['submission_text', 'file_url', 'submitted_at', 'score', 'feedback', 'status'];
const update = (submissionId, fields) => updateById('submissions', 'submission_id', submissionId, fields, UPDATABLE);
const remove = (submissionId) => deleteById('submissions', 'submission_id', submissionId);

module.exports = { findByAssignment, findById, findByStudentAssignment, create, update, remove };