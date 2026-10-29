const getAnnouncementsByCourse = async (req, res) => {
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
};

const createAnnouncement = async (req, res) => {
    try {
        const { title, content, course_id, user_id } = req.body;
        const [result] = await req.db.query(
            "INSERT INTO announcements (title, content, course_id, user_id) VALUES (?, ?, ?, ?)",
            [title, content, course_id, user_id]
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
};

module.exports = {
    getAnnouncementsByCourse,
    createAnnouncement
};