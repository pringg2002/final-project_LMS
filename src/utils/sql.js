const db = require('../db');

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj && obj[k] !== undefined) out[k] = obj[k];
  return out;
}

async function updateById(table, pk, id, fields, allowed) {
  const keys = Object.keys(fields).filter((k) => allowed.includes(k) && fields[k] !== undefined);
  if (!keys.length) return 0;
  const set = keys.map((k) => `${k} = ?`).join(', ');
  const [result] = await db.query(`UPDATE ${table} SET ${set} WHERE ${pk} = ?`, [
    ...keys.map((k) => fields[k]),
    id,
  ]);
  return result.affectedRows;
}

async function deleteById(table, pk, id) {
  const [result] = await db.query(`DELETE FROM ${table} WHERE ${pk} = ?`, [id]);
  return result.affectedRows;
}

const pad = (n) => String(n).padStart(2, '0');
function toMysqlDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

module.exports = { pick, updateById, deleteById, toMysqlDate };