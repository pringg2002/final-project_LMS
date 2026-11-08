const db = require('../db');

async function lessonCounts(studentId, moduleId) {
  const [rows] = await db.query(
    `SELECT COUNT(l.lesson_id) AS total,
            COALESCE(SUM(CASE WHEN lp.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed
     FROM lessons l
     LEFT JOIN lesson_progress lp ON lp.lesson_id = l.lesson_id AND lp.student_id = ?
     WHERE l.module_id = ? AND l.status = 'published'`,
    [studentId, moduleId]
  );
  return { total: Number(rows[0].total), completed: Number(rows[0].completed) };
}

async function latestQuizScores(studentId, moduleId) {
  const [rows] = await db.query(
    `SELECT q.quiz_id, q.title, q.attempt_limit, a.score,
            (SELECT COUNT(*) FROM attempts a3
             WHERE a3.quiz_id = q.quiz_id AND a3.student_id = ? AND a3.status = 'graded') AS graded_attempts
     FROM quizzes q
     LEFT JOIN attempts a ON a.attempt_id = (
        SELECT a2.attempt_id FROM attempts a2
        WHERE a2.quiz_id = q.quiz_id AND a2.student_id = ? AND a2.status = 'graded'
        ORDER BY a2.attempt_number DESC LIMIT 1)
     WHERE q.module_id = ? AND q.status = 'published'
     ORDER BY q.quiz_id`,
    [studentId, studentId, moduleId]
  );
  return rows.map((r) => ({
    quiz_id: r.quiz_id,
    title: r.title,
    attempt_limit: r.attempt_limit === null ? null : Number(r.attempt_limit),
    graded_attempts: Number(r.graded_attempts),
    score: r.score === null ? null : Number(r.score),
  }));
}

async function findUnlock(studentId, moduleId) {
  const [rows] = await db.query(
    `SELECT mu.unlock_id, mu.module_id, mu.student_id, mu.unlocked_by, mu.reason, mu.created_at,
            CONCAT(t.first_name, ' ', t.last_name) AS unlocked_by_name
     FROM module_unlocks mu
     INNER JOIN users t ON t.user_id = mu.unlocked_by
     WHERE mu.student_id = ? AND mu.module_id = ?`,
    [studentId, moduleId]
  );
  return rows[0] || null;
}

async function listUnlocks(moduleId) {
  const [rows] = await db.query(
    `SELECT mu.unlock_id, mu.module_id, mu.student_id, mu.unlocked_by, mu.reason, mu.created_at,
            CONCAT(s.first_name, ' ', s.last_name) AS student_name,
            CONCAT(t.first_name, ' ', t.last_name) AS unlocked_by_name
     FROM module_unlocks mu
     INNER JOIN users s ON s.user_id = mu.student_id
     INNER JOIN users t ON t.user_id = mu.unlocked_by
     WHERE mu.module_id = ?
     ORDER BY mu.created_at DESC`,
    [moduleId]
  );
  return rows;
}

async function createUnlock({ module_id, student_id, unlocked_by, reason }) {
  const [result] = await db.query(
    'INSERT INTO module_unlocks (module_id, student_id, unlocked_by, reason) VALUES (?, ?, ?, ?)',
    [module_id, student_id, unlocked_by, reason]
  );
  return result.insertId;
}

async function deleteUnlock(studentId, moduleId) {
  const [result] = await db.query('DELETE FROM module_unlocks WHERE student_id = ? AND module_id = ?', [
    studentId,
    moduleId,
  ]);
  return result.affectedRows;
}

async function enrolledStudents(courseId) {
  const [rows] = await db.query(
    `SELECT u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS student_name
     FROM enrollments e
     INNER JOIN users u ON u.user_id = e.student_id
     WHERE e.course_id = ? AND e.status <> 'dropped'
     ORDER BY u.last_name, u.first_name`,
    [courseId]
  );
  return rows;
}

module.exports = {
    lessonCounts,
    latestQuizScores,
    findUnlock,
    listUnlocks,
    createUnlock,
    deleteUnlock,
    enrolledStudents
};
