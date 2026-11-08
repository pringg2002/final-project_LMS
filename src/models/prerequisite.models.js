const db = require('../db');
const { deleteById } = require('../utils/sql');

async function findByModule(moduleId) {
  const [rows] = await db.query(
    `SELECT mp.prerequisite_id, mp.module_id, mp.prerequisite_module_id, mp.minimum_score, mp.created_at,
            pm.title AS prerequisite_title
     FROM module_prerequisites mp
     INNER JOIN modules pm ON pm.module_id = mp.prerequisite_module_id
     WHERE mp.module_id = ?
     ORDER BY pm.module_order`,
    [moduleId]
  );
  return rows;
}

async function findById(prerequisiteId) {
  const [rows] = await db.query('SELECT * FROM module_prerequisites WHERE prerequisite_id = ?', [prerequisiteId]);
  return rows[0] || null;
}

async function findPrerequisiteIds(moduleId) {
  const [rows] = await db.query('SELECT prerequisite_module_id FROM module_prerequisites WHERE module_id = ?', [
    moduleId,
  ]);
  return rows.map((r) => r.prerequisite_module_id);
}

async function findDependents(moduleId) {
  const [rows] = await db.query('SELECT module_id FROM module_prerequisites WHERE prerequisite_module_id = ?', [
    moduleId,
  ]);
  return rows.map((r) => r.module_id);
}

async function create({ module_id, prerequisite_module_id, minimum_score = 75 }) {
  const [result] = await db.query(
    'INSERT INTO module_prerequisites (module_id, prerequisite_module_id, minimum_score) VALUES (?, ?, ?)',
    [module_id, prerequisite_module_id, minimum_score]
  );
  return result.insertId;
}

const remove = (prerequisiteId) => deleteById('module_prerequisites', 'prerequisite_id', prerequisiteId);

module.exports = { findByModule, findById, findPrerequisiteIds, findDependents, create, remove };