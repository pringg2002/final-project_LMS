const db = require('../db');

const AttemptService = {
  async loadAttempt(attemptId) {
    const [rows] = await db.query('SELECT * FROM attempts WHERE attempt_id = ?', [attemptId]);
    return { attempt: rows[0] || null, isManager: false };
  }
};

module.exports = AttemptService;