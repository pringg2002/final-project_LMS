const Assignment = require('../models/assignment.model');

// Get all assignments
exports.getAllAssignments = (req, res) => {
    Assignment.getAll((err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, data: results });
    });
};

// Create a new assignment
exports.createAssignment = (req, res) => {
    const assignmentData = req.body;
    
    Assignment.create(assignmentData, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ 
            success: true, 
            message: "Assignment created successfully",
            assignmentId: results.insertId 
        });
    });
};