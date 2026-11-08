const db = require('../db');
const { updateById, deleteById } = require('../utils/sql');

const BASE = `
  SELECT e.enrollment_id, e.student_id, e.course_id, e.enrolled_at, e.status, e.completion_date, e.final_score,
         CONCAT(u.first_name, ' ', u.last_name) AS student_name, u.email AS student_email,
         c.course_code, c.course_name, c.instructor_id
  FROM enrollments e
  INNER JOIN users u ON u.user_id = e.student_id
  INNER JOIN courses c ON c.course_id = e.course_id`;

async function findAll({ studentId, instructorId, courseId } = {}) {
  const where = [];
  const params = [];
  if (studentId) { where.push('e.student_id = ?'); params.push(studentId); }
  if (instructorId) { where.push('c.instructor_id = ?'); params.push(instructorId); }
  if (courseId) { where.push('e.course_id = ?'); params.push(courseId); }
  const [rows] = await db.query(
    `${BASE} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY e.enrolled_at DESC`,
    params
  );
  return rows;
}

async function findById(enrollmentId) {
  const [rows] = await db.query(`${BASE} WHERE e.enrollment_id = ?`, [enrollmentId]);
  return rows[0] || null;
}

async function findByStudentCourse(studentId, courseId) {
  const [rows] = await db.query(`${BASE} WHERE e.student_id = ? AND e.course_id = ?`, [studentId, courseId]);
  return rows[0] || null;
}

async function findActiveStudentIds(courseId) {
  const [rows] = await db.query(
    "SELECT student_id FROM enrollments WHERE course_id = ? AND status IN ('active','completed')",
    [courseId]
  );
  return rows.map((r) => r.student_id);
}

async function create({ student_id, course_id }) {
  const [result] = await db.query('INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)', [student_id, course_id]);
  return result.insertId;
}

const UPDATABLE = ['status', 'completion_date', 'final_score'];
const update = (enrollmentId, fields) => updateById('enrollments', 'enrollment_id', enrollmentId, fields, UPDATABLE);
const remove = (enrollmentId) => deleteById('enrollments', 'enrollment_id', enrollmentId);


async function getEnrollmentActivityReport() {
  const E = 'SELECT student_id, COUNT(*) AS enrolled_courses FROM enrollments GROUP BY student_id';
  const A = 'SELECT student_id, COUNT(*) AS quiz_attempts FROM attempts GROUP BY student_id';
  const pick = `COALESCE(e.student_id, a.student_id) AS student_id,
                COALESCE(e.enrolled_courses, 0) AS enrolled_courses,
                COALESCE(a.quiz_attempts, 0) AS quiz_attempts,
                CASE WHEN e.student_id IS NOT NULL AND a.student_id IS NOT NULL THEN 'enrollment + activity'
                     WHEN e.student_id IS NOT NULL THEN 'enrollment only'
                     ELSE 'activity only' END AS record_source`;
  const [rows] = await db.query(
    `SELECT u.user_id AS student_id, CONCAT(u.first_name, ' ', u.last_name) AS student_name, u.email,
            x.enrolled_courses, x.quiz_attempts, x.record_source
     FROM (
       SELECT ${pick} FROM (${E}) e LEFT JOIN (${A}) a ON e.student_id = a.student_id
       UNION
       SELECT ${pick} FROM (${E}) e RIGHT JOIN (${A}) a ON e.student_id = a.student_id
     ) x
     INNER JOIN users u ON u.user_id = x.student_id
     ORDER BY u.last_name, u.first_name`
  );
  return rows;
}

module.exports = {
  findAll, findById, findByStudentCourse, findActiveStudentIds, create, update, remove,
  getEnrollmentActivityReport,
};
