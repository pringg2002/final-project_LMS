const db = require('../db');
const { updateById, deleteById } = require('../utils/sql');

const D_BASE = `
  SELECT d.discussion_id, d.module_id, d.author_id, d.title, d.content, d.created_at, d.updated_at, d.status,
         CONCAT(u.first_name, ' ', u.last_name) AS author_name,
         (SELECT COUNT(*) FROM discussion_replies r WHERE r.discussion_id = d.discussion_id AND r.status = 'active') AS reply_count
  FROM discussions d
  INNER JOIN users u ON u.user_id = d.author_id`;

const R_BASE = `
  SELECT r.reply_id, r.discussion_id, r.author_id, r.content, r.created_at, r.updated_at, r.status,
         CONCAT(u.first_name, ' ', u.last_name) AS author_name
  FROM discussion_replies r
  INNER JOIN users u ON u.user_id = r.author_id`;

async function findByModule(moduleId) {
  const [rows] = await db.query(`${D_BASE} WHERE d.module_id = ? ORDER BY d.created_at DESC, d.discussion_id DESC`, [moduleId]);
  return rows;
}
async function findById(discussionId) {
  const [rows] = await db.query(`${D_BASE} WHERE d.discussion_id = ?`, [discussionId]);
  return rows[0] || null;
}
async function create({ module_id, author_id, title, content }) {
  const [result] = await db.query('INSERT INTO discussions (module_id, author_id, title, content) VALUES (?, ?, ?, ?)', [
    module_id, author_id, title, content,
  ]);
  return result.insertId;
}
const update = (id, fields) => updateById('discussions', 'discussion_id', id, fields, ['title', 'content', 'status']);
const remove = (id) => deleteById('discussions', 'discussion_id', id);

async function findRepliesByDiscussion(discussionId) {
  const [rows] = await db.query(`${R_BASE} WHERE r.discussion_id = ? AND r.status = 'active' ORDER BY r.created_at, r.reply_id`, [discussionId]);
  return rows;
}
async function findReplyById(replyId) {
  const [rows] = await db.query(`${R_BASE} WHERE r.reply_id = ?`, [replyId]);
  return rows[0] || null;
}
async function createReply({ discussion_id, author_id, content }) {
  const [result] = await db.query('INSERT INTO discussion_replies (discussion_id, author_id, content) VALUES (?, ?, ?)', [
    discussion_id, author_id, content,
  ]);
  return result.insertId;
}
const updateReply = (id, fields) => updateById('discussion_replies', 'reply_id', id, fields, ['content', 'status']);

module.exports = {
  findByModule, findById, create, update, remove,
  findRepliesByDiscussion, findReplyById, createReply, updateReply,
};
