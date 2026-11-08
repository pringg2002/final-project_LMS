const db = require('../db');

// Question model stub for SQLite
const Question = {
  async findById(questionId) {
    const [rows] = await db.query('SELECT * FROM questions WHERE question_id = ?', [questionId]);
    return rows[0] || null;
  }
};

module.exports = Question;
