const express = require('express');
const router = express.Router();

router.get('/user/:user_id', async (req, res) => {
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
});

router.post('/', async (req, res) => {
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
});

module.exports = router;