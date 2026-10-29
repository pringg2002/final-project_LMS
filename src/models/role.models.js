const db = require('../db');

async function findAll() {
  const [rows] = await db.query(
    'SELECT role_id, role_name, description, created_at FROM roles ORDER BY role_id'
  );
  return rows;
}

async function findByName(roleName) {
  const [rows] = await db.query(
    'SELECT role_id, role_name, description FROM roles WHERE role_name = ?',
    [roleName]
  );
  return rows[0] || null;
}

async function findById(roleId) {
  const [rows] = await db.query(
    'SELECT role_id, role_name, description FROM roles WHERE role_id = ?',
    [roleId]
  );
  return rows[0] || null;
}

module.exports = { findAll, findByName, findById };
