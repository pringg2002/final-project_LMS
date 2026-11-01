const db = require('../db');

async function getEnrollmentActivityReport() {
    const query = `
        SELECT e.user_id, e.course_id, a.activity_data 
        FROM enrollments e 
        LEFT JOIN activity a ON e.user_id = a.user_id
        UNION
        SELECT e.user_id, e.course_id, a.activity_data 
        FROM enrollments e 
        RIGHT JOIN activity a ON e.user_id = a.user_id;
    `;
    const [rows] = await db.query(query);
    return rows;
}

module.exports = { getEnrollmentActivityReport };