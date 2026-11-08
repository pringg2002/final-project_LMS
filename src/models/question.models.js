const db = require('../db');
const { updateById, deleteById } = require('../utils/sql');

const COLS =
  'question_id, quiz_id, question_text, question_type, points, question_order, options, correct_answer, created_at';

function parseOptions(row) {
  if (row && typeof row.options === 'string') {
    try { row.options = JSON.parse(row.options); } catch (e) { row.options = null; }
  }
  return row;
}

async function findByQuiz(quizId) {
  const [rows] = await db.query(`SELECT ${COLS} FROM questions WHERE quiz_id = ? ORDER BY question_order, question_id`, [quizId]);
  return rows.map(parseOptions);
}

async function findById(questionId) {
  const [rows] = await db.query(`SELECT ${COLS} FROM questions WHERE question_id = ?`, [questionId]);
  return parseOptions(rows[0]) || null;
}

async function nextOrder(quizId) {
  const [rows] = await db.query('SELECT COALESCE(MAX(question_order), 0) + 1 AS next FROM questions WHERE quiz_id = ?', [quizId]);
  return Number(rows[0].next);
}

async function sumPoints(quizId) {
  const [rows] = await db.query('SELECT COALESCE(SUM(points), 0) AS total FROM questions WHERE quiz_id = ?', [quizId]);
  return Number(rows[0].total);
}

async function create({ quiz_id, question_text, question_type = 'multiple_choice', points = 1, question_order, options = null, correct_answer }) {
  const [result] = await db.query(
    `INSERT INTO questions (quiz_id, question_text, question_type, points, question_order, options, correct_answer)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [quiz_id, question_text, question_type, points, question_order, options ? JSON.stringify(options) : null, correct_answer]
  );
  return result.insertId;
}

const UPDATABLE = ['question_text', 'question_type', 'points', 'question_order', 'options', 'correct_answer'];
const update = (questionId, fields) => {
  const f = { ...fields };
  if (f.options !== undefined) f.options = f.options === null ? null : JSON.stringify(f.options);
  return updateById('questions', 'question_id', questionId, f, UPDATABLE);
};
const remove = (questionId) => deleteById('questions', 'question_id', questionId);

module.exports = { findByQuiz, findById, nextOrder, sumPoints, create, update, remove };