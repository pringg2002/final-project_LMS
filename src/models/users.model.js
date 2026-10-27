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
    u.created_at,
    u.updated_at
  FROM users u
  INNER JOIN roles r
    ON r.role_id = u.role_id
`;


async function findAll() {
  const [rows] = await db.query(
    `${PUBLIC_SELECT}
     ORDER BY u.user_id`
  );

  return rows;
}

async function findById(userId) {
  const [rows] = await db.query(
    `${PUBLIC_SELECT}
     WHERE u.user_id = ?`,
    [userId]
  );

  return rows[0] || null;
}

async function findByEmailWithPassword(email) {
  const [rows] = await db.query(
    `SELECT
      u.user_id,
      u.role_id,
      r.role_name AS role,
      u.first_name,
      u.middle_name,
      u.last_name,
      u.email,
      u.password_hash,
      u.status
    FROM users u
    INNER JOIN roles r
      ON r.role_id = u.role_id
    WHERE u.email = ?`,
    [email]
  );

  return rows[0] || null;
}

async function findByIdWithPassword(userId) {
  const [rows] = await db.query(
    `SELECT
      user_id,
      password_hash
    FROM users
    WHERE user_id = ?`,
    [userId]
  );

  return rows[0] || null;
}

async function create({
  role_id,
  first_name,
  middle_name,
  last_name,
  email,
  password_hash,
  status = 'active'
}) {
  const [result] = await db.query(
    `INSERT INTO users (
      role_id,
      first_name,
      middle_name,
      last_name,
      email,
      password_hash,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      role_id,
      first_name,
      middle_name,
      last_name,
      email,
      password_hash,
      status
    ]
  );

  return result.insertId;
}

const UPDATABLE = [
  'role_id',
  'first_name',
  'middle_name',
  'last_name',
  'email',
  'password_hash',
  'status'
];

async function update(userId, fields) {
  const keys = Object.keys(fields).filter(
    (key) => UPDATABLE.includes(key)
  );

  if (!keys.length) {
    return 0;
  }

  const setClause = keys
    .map((key) => `${key} = ?`)
    .join(', ');

  const values = keys.map(
    (key) => fields[key]
  );

  values.push(userId);

  const [result] = await db.query(
    `UPDATE users
     SET ${setClause}
     WHERE user_id = ?`,
    values
  );

  return result.affectedRows;
}

async function remove(userId) {
  const [result] = await db.query(
    `DELETE FROM users
     WHERE user_id = ?`,
    [userId]
  );

  return result.affectedRows;
}

async function getUsersWithRolesReport() {
  const [rows] = await db.query(
    `SELECT
      u.user_id,

      CONCAT(
        u.first_name,
        ' ',
        CASE
          WHEN u.middle_name IS NOT NULL
            AND u.middle_name <> ''
          THEN CONCAT(u.middle_name, ' ')
          ELSE ''
        END,
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
      u.first_name`
  );

  return rows;
}


module.exports = {
  findAll,
  findById,
  findByEmailWithPassword,
  findByIdWithPassword,
  create,
  update,
  remove,
  getUsersWithRolesReport
};