const db = require('../db');
const { updateById } = require('../utils/sql');

const BASE = `
  SELECT aa.answer_id, aa.attempt_id, aa.question_id, aa.answer_text, aa.is_correct, aa.points_earned, aa.answered_at,
         q.question_text, q.question_type, q.points AS question_points
  FROM attempt_answers aa
  INNER JOIN questions q ON q.question_id = aa.question_id`;

async function findByAttempt(attemptId) {
  const [rows] = await db.query(`${BASE} WHERE aa.attempt_id = ? ORDER BY q.question_order, q.question_id`, [attemptId]);
  return rows;
}

async function findById(answerId) {
  const [rows] = await db.query(`${BASE} WHERE aa.answer_id = ?`, [answerId]);
  return rows[0] || null;
}

// One answer per (attempt, question): saving again replaces the previous answer.
async function upsert({ attempt_id, question_id, answer_text, is_correct, points_earned }) {
  await db.query(
    `INSERT INTO attempt_answers (attempt_id, question_id, answer_text, is_correct, points_earned)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       answer_text = VALUES(answer_text),
       is_correct = VALUES(is_correct),
       points_earned = VALUES(points_earned),
       answered_at = CURRENT_TIMESTAMP`,
    [attempt_id, question_id, answer_text, is_correct, points_earned]
  );
}

const UPDATABLE = ['answer_text', 'is_correct', 'points_earned'];
const update = (answerId, fields) => updateById('attempt_answers', 'answer_id', answerId, fields, UPDATABLE);

module.exports = { findByAttempt, findById, upsert, update };