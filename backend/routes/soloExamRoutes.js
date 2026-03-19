const express = require("express");
const router = express.Router();
const SoloExamController = require("../controllers/SoloExamController");
const { authenticate } = require("../middleware/auth");

/**
 * Dedicated Solo Teacher Mode Routes
 * Isolated from Organization Mode endpoints to prevent data conflicts.
 */

// DELETE /api/solo/exams/:id
// Specialized route for solo teacher exam deletion
router.delete("/solo/exams/:id", authenticate, SoloExamController.deleteSoloExam);

module.exports = router;
