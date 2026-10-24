const express = require("express");

const router = express.Router();

router.get("/status", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Learning Module API is running"
    });
});

module.exports = router;