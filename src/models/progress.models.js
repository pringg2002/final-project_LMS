const db = require('../db');
const { updateById } = require('../utils/sql');

const COLS =
  'progress_id, student_id, lesson_id, status, progress_percent, started_at, completed_at, last_accessed_at';

async function findByStudent(studentId) {
  const [rows] = await db.query(
    `SELECT lp.progress_id, lp.student_id, lp.lesson_id, lp.status, lp.progress_percent,
            lp.started_at, lp.completed_at, lp.last_accessed_at,
            l.title AS lesson_title, l.module_id, m.title AS module_title, m.course_id
     FROM lesson_progress lp
     INNER JOIN lessons l ON l.lesson_id = lp.lesson_id
     INNER JOIN modules m ON m.module_id = l.module_id
     WHERE lp.student_id = ?
     ORDER BY lp.last_accessed_at DESC`,
    [studentId]
  );
  return rows;
}

async function findByLesson(lessonId) {
  const [rows] = await db.query(
    `SELECT lp.progress_id, lp.student_id, lp.lesson_id, lp.status, lp.progress_percent,
            lp.started_at, lp.completed_at, lp.last_accessed_at,
            CONCAT(u.first_name, ' ', u.last_name) AS student_name
     FROM lesson_progress lp INNER JOIN users u ON u.user_id = lp.student_id
     WHERE lp.lesson_id = ? ORDER BY u.last_name`,
    [lessonId]
  );
  return rows;
}

async function findByStudentLesson(studentId, lessonId) {
  const [rows] = await db.query(`SELECT ${COLS} FROM lesson_progress WHERE student_id = ? AND lesson_id = ?`, [
    studentId,
    lessonId,
  ]);
  return rows[0] || null;
}

async function findById(progressId) {
  const [rows] = await db.query(`SELECT ${COLS} FROM lesson_progress WHERE progress_id = ?`, [progressId]);
  return rows[0] || null;
}

async function create({ student_id, lesson_id, status, progress_percent, completed }) {
  const [result] = await db.query(
    `INSERT INTO lesson_progress
       (student_id, lesson_id, status, progress_percent, started_at, completed_at, last_accessed_at)
     VALUES (?, ?, ?, ?, NOW(), ${completed ? 'NOW()' : 'NULL'}, NOW())`,
    [student_id, lesson_id, status, progress_percent]
  );
  return result.insertId;
}

const UPDATABLE = ['status', 'progress_percent', 'completed_at', 'last_accessed_at'];
const update = (progressId, fields) => updateById('lesson_progress', 'progress_id', progressId, fields, UPDATABLE);

module.exports = { findByStudent, findByLesson, findByStudentLesson, findById, create, update };
