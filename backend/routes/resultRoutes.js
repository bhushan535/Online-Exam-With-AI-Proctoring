const express = require("express");
const router = express.Router();
const Result = require("../models/Result");
const Exam = require("../models/Exam");
const Class = require("../models/Class");

/* ── GET all results for one student (enriched with exam details) ── */
router.get("/results/student/:studentId", async (req, res) => {
  try {
    const results = await Result.find({ studentId: req.params.studentId })
      .sort({ submittedAt: -1 });

    const enriched = await Promise.all(
      results.map(async (r) => {
        const exam = await Exam.findById(r.examId).catch(() => null);
        return {
          ...r.toObject(),
          examName: exam?.examName || "Unknown Exam",
          subject:  exam?.subject  || "",
          subCode:  exam?.subCode  || "",
          examDate: exam?.examDate || null,
        };
      })
    );

    res.json({ success: true, results: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── GET all results for one exam (teacher view — with rollNo from Class) ── */
router.get("/results/exam/:examId", async (req, res) => {
  try {
    const results = await Result.find({ examId: req.params.examId });

    if (!results.length) {
      return res.json({ success: true, results: [], exam: null });
    }

    // Get the exam to find classId + exam info
    const exam = await Exam.findById(req.params.examId).catch(() => null);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    // Get the class to look up rollNo for each student
    let classStudents = [];
    if (exam.classId) {
      const classDoc = await Class.findById(exam.classId).catch(() => null);
      classStudents = classDoc?.students || [];
    }

    // Build map: enrollment → rollNo
    const rollNoMap = {};
    classStudents.forEach(s => {
      rollNoMap[s.enrollment] = s.rollNo;
    });

    // Attach rollNo to each result, default sort: score descending
    const enriched = results.map(r => ({
      ...r.toObject(),
      rollNo: rollNoMap[r.studentId] || "—",
    }));
    enriched.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      exam: {
        examName:   exam.examName,
        subject:    exam.subject,
        subCode:    exam.subCode,
        branch:     exam.branch,
        semester:   exam.semester,
        totalMarks: exam.totalMarks,
      },
      results: enriched,
    });
  } catch (err) {
    console.error("EXAM RESULTS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── GET summary stats for one exam ── */
router.get("/results/exam/:examId/summary", async (req, res) => {
  try {
    const results = await Result.find({ examId: req.params.examId });

    if (!results.length) {
      return res.json({
        success: true,
        summary: { totalAttempted: 0, avgScore: 0, highest: 0, lowest: 0, passRate: 0, totalMarks: 0 },
      });
    }

    const scores     = results.map((r) => r.score);
    const totalMarks = results[0].totalMarks;
    const passed     = results.filter((r) => r.percentage >= 40).length;

    res.json({
      success: true,
      summary: {
        totalAttempted: results.length,
        avgScore:  +((scores.reduce((a, b) => a + b, 0) / results.length).toFixed(2)),
        highest:   Math.max(...scores),
        lowest:    Math.min(...scores),
        passRate:  +((passed / results.length * 100).toFixed(1)),
        totalMarks,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
