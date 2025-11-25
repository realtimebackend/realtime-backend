const express = require("express");
const router = express.Router();
const nocoService = require("../services/nocoService");

// GET /api/scan
router.get("/scan", async (req, res) => {
  try {
    const data = await nocoService.getRecords();
    res.json({ success: true, data });
  } catch (err) {
    console.error("SCAN ROUTE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message
    });
  }
});

module.exports = router;
