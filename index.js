const express = require("express");
const router = express.Router();

const enrollmentRoutes = require("./enrollments");

router.get("/status", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Learning Module API is running"
    });
});

router.use("/enrollments", enrollmentRoutes);

module.exports = router;