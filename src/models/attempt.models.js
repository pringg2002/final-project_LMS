const db = require('../db');
const { updateById } = require('../utils/sql');

const BASE = `
  SELECT a.attempt_id, a.quiz_id, a.student_id, a.attempt_number, a.score, a.started_at, a.submitted_at, a.status,
         CONCAT(u.first_name, ' ', u.last_name) AS student_name
  FROM attempts a
  INNER JOIN users u ON u.user_id = a.student_id`;

async function findByQuiz(quizId, { studentId } = {}) {
  const [rows] = await db.query(
    `${BASE} WHERE a.quiz_id = ? ${studentId ? 'AND a.student_id = ?' : ''} ORDER BY a.student_id, a.attempt_number`,
    studentId ? [quizId, studentId] : [quizId]
  );
  return rows;
}

async function findById(attemptId) {
  const [rows] = await db.query(`${BASE} WHERE a.attempt_id = ?`, [attemptId]);
  return rows[0] || null;
}

async function findInProgress(quizId, studentId) {
  const [rows] = await db.query(
    `${BASE} WHERE a.quiz_id = ? AND a.student_id = ? AND a.status = 'in_progress' ORDER BY a.attempt_number DESC LIMIT 1`,
    [quizId, studentId]
  );
  return rows[0] || null;
}

async function countByStudentQuiz(quizId, studentId) {
  const [rows] = await db.query('SELECT COUNT(*) AS n, COALESCE(MAX(attempt_number), 0) AS max_n FROM attempts WHERE quiz_id = ? AND student_id = ?', [
    quizId,
    studentId,
  ]);
  return { count: Number(rows[0].n), maxNumber: Number(rows[0].max_n) };
}

async function create({ quiz_id, student_id, attempt_number }) {
  const [result] = await db.query('INSERT INTO attempts (quiz_id, student_id, attempt_number) VALUES (?, ?, ?)', [
    quiz_id,
    student_id,
    attempt_number,
  ]);
  return result.insertId;
}

async function sumEarnedPoints(attemptId) {
  const [rows] = await db.query('SELECT COALESCE(SUM(points_earned), 0) AS total FROM attempt_answers WHERE attempt_id = ?', [attemptId]);
  return Number(rows[0].total);
}

const UPDATABLE = ['score', 'submitted_at', 'status'];
const update = (attemptId, fields) => updateById('attempts', 'attempt_id', attemptId, fields, UPDATABLE);

module.exports = { findByQuiz, findById, findInProgress, countByStudentQuiz, create, sumEarnedPoints, update };