const db = require('../config/db'); // Adjust if your config path is different

const Assignment = {
    // Get all assignments
    getAll: (callback) => {
        const query = "SELECT * FROM assignments";
        db.query(query, callback);
    },

    // Create a new assignment
    create: (data, callback) => {
        const query = "INSERT INTO assignments (title, description, course_id, due_date) VALUES (?, ?, ?, ?)";
        db.query(query, [data.title, data.description, data.course_id, data.due_date], callback);
    },

    // Get an assignment by its ID
    findById: (id, callback) => {
        const query = "SELECT * FROM assignments WHERE id = ?";
        db.query(query, [id], callback);
    }
};

module.exports = Assignment;