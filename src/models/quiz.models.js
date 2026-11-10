const db = require('../db');
const { updateById } = require('../utils/sql');
const AppError = require('../utils/AppError');

const BASE = `
  SELECT
    q.quiz_id,
    q.module_id,
    q.title,
    q.description,
    q.passing_score,
    q.time_limit_minutes,
    q.attempt_limit,
    q.status,
    q.created_at,
    (
      SELECT COUNT(*)
      FROM questions x
      WHERE x.quiz_id = q.quiz_id
    ) AS question_count
  FROM quizzes q
`;

async function findByModule(moduleId, { publishedOnly = false } = {}) {
  const [rows] = await db.query(
    `${BASE}
     WHERE q.module_id = ?
     ${publishedOnly ? "AND q.status = 'published'" : ''}
     ORDER BY q.quiz_id`,
    [moduleId]
  );
  return rows;
}

async function findById(quizId) {
  const [rows] = await db.query(
    `${BASE} WHERE q.quiz_id = ?`,
    [quizId]
  );

  return rows[0] || null;
}

async function create({
  module_id,
  title,
  description = null,
  passing_score,
  time_limit_minutes = null,
  attempt_limit = null,
  status = 'draft'
}) {
  const [result] = await db.query(
    `INSERT INTO quizzes (
      module_id,
      title,
      description,
      passing_score,
      time_limit_minutes,
      attempt_limit,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      module_id,
      title,
      description,
      passing_score,
      time_limit_minutes,
      attempt_limit,
      status
    ]
  );
  return result.insertId;
}

const UPDATABLE = [
  'title',
  'description',
  'passing_score',
  'time_limit_minutes',
  'attempt_limit',
  'status'
];

const update = (quizId, fields) =>
  updateById(
    'quizzes',
    'quiz_id',
    quizId,
    fields,
    UPDATABLE
  );

async function countAttempts(quizId) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM attempts
     WHERE quiz_id = ?`,
    [quizId]
  );

  return Number(rows[0].total);
}

async function remove(quizId) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [quizzes] = await connection.query(
      `SELECT quiz_id, status
       FROM quizzes
       WHERE quiz_id = ?
       FOR UPDATE`,
      [quizId]
    );

    if (!quizzes.length) {
      throw new AppError('Quiz not found', 404);
    }

    if (quizzes[0].status !== 'draft') {
      throw new AppError(
        'Only draft quizzes can be deleted.',
        409
      );
    }

    const [attempts] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM attempts
       WHERE quiz_id = ?`,
      [quizId]
    );

    if (Number(attempts[0].total) > 0) {
      throw new AppError(
        'This quiz cannot be deleted because student attempts already exist.',
        409
      );
    }
    await connection.query(
      `DELETE FROM questions
       WHERE quiz_id = ?`,
      [quizId]
    );

    await connection.query(
      `DELETE FROM quizzes
       WHERE quiz_id = ?`,
      [quizId]
    );

    await connection.commit();

    return true;

  } catch (error) {
    await connection.rollback();
    throw error;

  } finally {
    connection.release();
  }
}

async function getQuizQuestionsReport() {
  const [rows] = await db.query(
    `SELECT
      q.quiz_id,
      q.title AS quiz_title,
      m.module_id,
      m.title AS module_title,
      qu.question_id,
      qu.question_text,
      qu.question_type,
      qu.points,
      qu.question_order
     FROM quizzes q
     INNER JOIN questions qu
       ON qu.quiz_id = q.quiz_id
     INNER JOIN modules m
       ON m.module_id = q.module_id
     ORDER BY q.quiz_id, qu.question_order`
  );
  return rows;
}

module.exports = {
  findByModule,
  findById,
  create,
  update,
  remove,
  countAttempts,
  getQuizQuestionsReport
};