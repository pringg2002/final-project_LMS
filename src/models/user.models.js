const db = require('../db');

const PUBLIC_SELECT = `
  SELECT
    u.user_id,
    u.role_id,
    r.role_name AS role,
    u.first_name,
    u.middle_name,
    u.last_name,
    u.email,
    u.status,
    u.must_change_password,
    u.created_at,
    u.updated_at
  FROM users u
  INNER JOIN roles r
    ON r.role_id = u.role_id
`;

async function findAll() {
  const [rows] = await db.query(
    `${PUBLIC_SELECT} ORDER BY u.user_id`
  );

  return rows;
}

async function findStudents() {
  const [rows] = await db.query(`
    ${PUBLIC_SELECT}
    WHERE r.role_name = 'student'
      AND u.status = 'active'
    ORDER BY u.last_name, u.first_name
  `);

  return rows;
}

async function findStudentsByInstructor(instructorId) {
  const [rows] = await db.query(`
    ${PUBLIC_SELECT}
    WHERE r.role_name = 'student'
      AND u.status = 'active'
      AND EXISTS (
        SELECT 1
        FROM enrollments e
        INNER JOIN courses c
          ON c.course_id = e.course_id
        WHERE e.student_id = u.user_id
          AND c.instructor_id = ?
          AND e.status IN ('active', 'completed')
      )
    ORDER BY u.last_name, u.first_name
  `, [instructorId]);

  return rows;
}

async function findById(userId) {
  const [rows] = await db.query(
    `${PUBLIC_SELECT} WHERE u.user_id = ?`,
    [userId]
  );

  return rows[0] || null;
}

async function findByEmailWithPassword(email) {
  const [rows] = await db.query(`
    SELECT
      u.user_id,
      u.role_id,
      r.role_name AS role,
      u.first_name,
      u.middle_name,
      u.last_name,
      u.email,
      u.password_hash,
      u.status,
      u.must_change_password,
      u.token_version
    FROM users u
    INNER JOIN roles r
      ON r.role_id = u.role_id
    WHERE u.email = ?
  `, [email]);

  return rows[0] || null;
}

async function findByIdWithPassword(userId) {
  const [rows] = await db.query(`
    SELECT
      user_id,
      password_hash,
      must_change_password,
      token_version
    FROM users
    WHERE user_id = ?
  `, [userId]);

  return rows[0] || null;
}

async function create({
  role_id,
  first_name,
  middle_name = null,
  last_name,
  email,
  password_hash,
  status = 'active',
  must_change_password = false
}) {
  const [result] = await db.query(`
    INSERT INTO users (
      role_id,
      first_name,
      middle_name,
      last_name,
      email,
      password_hash,
      status,
      must_change_password
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    role_id,
    first_name,
    middle_name,
    last_name,
    email,
    password_hash,
    status,
    must_change_password
  ]);

  return result.insertId;
}

const UPDATABLE = [
  'role_id',
  'first_name',
  'middle_name',
  'last_name',
  'email',
  'password_hash',
  'status',
  'must_change_password',
  'token_version'
];

async function update(userId, fields) {
  const keys = Object.keys(fields).filter(
    key => UPDATABLE.includes(key)
  );

  if (!keys.length) {
    return 0;
  }

  const setClause = keys
    .map(key => `${key} = ?`)
    .join(', ');

  const [result] = await db.query(
    `
      UPDATE users
      SET ${setClause}
      WHERE user_id = ?
    `,
    [
      ...keys.map(key => fields[key]),
      userId
    ]
  );

  return result.affectedRows;
}

async function remove(userId) {
  const [result] = await db.query(
    'DELETE FROM users WHERE user_id = ?',
    [userId]
  );

  return result.affectedRows;
}

async function getUsersWithRolesReport() {
  const [rows] = await db.query(`
    SELECT
      u.user_id,
      CONCAT_WS(
        ' ',
        u.first_name,
        NULLIF(u.middle_name, ''),
        u.last_name
      ) AS full_name,
      u.email,
      r.role_name AS role,
      u.status,
      u.created_at
    FROM users u
    INNER JOIN roles r
      ON u.role_id = r.role_id
    ORDER BY
      r.role_name,
      u.last_name,
      u.first_name
  `);

  return rows;
}

async function updatePassword(
  userId,
  passwordHash,
  mustChange = false
) {
  const [result] = await db.query(`
    UPDATE users
    SET
      password_hash = ?,
      must_change_password = ?,
      token_version = token_version + 1
    WHERE user_id = ?
  `, [
    passwordHash,
    mustChange,
    userId
  ]);

  return result.affectedRows;
}

async function bumpTokenVersion(userId) {
  await db.query(`
    UPDATE users
    SET token_version = token_version + 1
    WHERE user_id = ?
  `, [userId]);
}

async function findTokenState(userId) {
  const [rows] = await db.query(`
    SELECT
      token_version,
      must_change_password
    FROM users
    WHERE user_id = ?
  `, [userId]);

  return rows[0] || null;
}

module.exports = {
  updatePassword,
  bumpTokenVersion,
  findTokenState,
  findAll,
  findStudents,
  findStudentsByInstructor,
  findById,
  findByEmailWithPassword,
  findByIdWithPassword,
  create,
  update,
  remove,
  getUsersWithRolesReport
};