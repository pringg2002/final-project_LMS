const enrollmentModel = require('../models/enrollment.model');

const getEnrollmentsByUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        const [enrollments] = await req.db.query(
            "SELECT * FROM enrollments WHERE user_id = ? ORDER BY enrollment_date DESC",
            [user_id]
        );
        res.status(200).json({ success: true, data: enrollments });
    } catch (error) {
        console.error("Error fetching enrollments:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const createEnrollment = async (req, res) => {
    try {
        const { user_id, course_id } = req.body;
        
        const [result] = await req.db.query(
            "INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)",
            [user_id, course_id]
        );

        res.status(201).json({ 
            success: true, 
            message: "Enrolled successfully", 
            enrollment_id: result.insertId 
        });
    } catch (error) {
        console.error("Error creating enrollment:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getEnrollmentActivity = async (req, res) => {
    try {
        const data = await enrollmentModel.getEnrollmentActivityReport();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Error fetching enrollment activity report:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    getEnrollmentsByUser,
    createEnrollment,
    getEnrollmentActivity
};

