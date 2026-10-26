const express = require('express');
const router = express.Router();

router.get('/course/:course_id', async (req, res) => {
    try {
        const { course_id } = req.params;
        const [announcements] = await req.db.query(
            "SELECT * FROM announcements WHERE course_id = ? ORDER BY created_at DESC", 
            [course_id]
        );
        res.status(200).json({ success: true, data: announcements });
    } catch (error) {
        console.error("Error fetching announcements:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.post('/', async (req, res) => {
    try {
        const { course_id, author_id, title, content, published_at, expires_at, status } = req.body;
        
        const [result] = await req.db.query(
            `INSERT INTO announcements (course_id, author_id, title, content, published_at, expires_at, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [course_id, author_id, title, content, published_at || new Date(), expires_at || null, status || 'published']
        );

        res.status(201).json({ 
            success: true, 
            message: "Announcement created successfully", 
            announcement_id: result.insertId 
        });
    } catch (error) {
        console.error("Error creating announcement:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;

