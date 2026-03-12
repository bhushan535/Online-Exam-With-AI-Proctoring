const express = require("express");
const router = express.Router();
const ProctorLog = require("../models/ProctorLog");

// POST /api/violations
// Logs a new proctoring violation from the student's AttemptExamPage
router.post("/", async (req, res) => {
  try {
    const { examId, studentId, type, severity, timestamp, snapshot, meta } = req.body;

    const newLog = new ProctorLog({
      examId,
      studentId,
      type,
      severity,
      timestamp: timestamp ? new Date(timestamp) : undefined,
      snapshot,
      meta,
    });

    await newLog.save();

    res.status(201).json({ message: "Violation logged successfully" });
  } catch (error) {
    console.error("Error logging violation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/violations/:examId/:studentId
// Useful for the teacher dashboard to fetch logs for a specific student's attempt
router.get("/:examId/:studentId", async (req, res) => {
    try {
        const { examId, studentId } = req.params;
        const logs = await ProctorLog.find({ examId, studentId }).sort({ timestamp: -1 });
        res.status(200).json(logs);
    } catch (error) {
      console.error("Error fetching violations:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
});

// GET /api/violations/exam/:examId
// Fetch all violations for an exam (useful for teacher overall view)
router.get("/exam/:examId", async (req, res) => {
    try {
        const { examId } = req.params;
        // Could also aggregate to just count high severity violations per student
        const logs = await ProctorLog.find({ examId }).sort({ timestamp: -1 });
        res.status(200).json(logs);
    } catch (error) {
      console.error("Error fetching exam violations:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
