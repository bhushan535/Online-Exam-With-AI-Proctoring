const express = require("express");
const router = express.Router();
const Result = require("../models/Result");
const Exam = require("../models/Exam");
const Class = require("../models/Class");
const ProctorLog = require("../models/ProctorLog");
const ExamAccess = require("../models/ExamAccess");
const { authenticate } = require('../middleware/auth');

/* ── GET all results for one student (enriched with exam details) ── */
router.get("/results/student/:studentId", async (req, res) => {
  try {
    const results = await Result.find({ studentId: req.params.studentId })
      .sort({ submittedAt: -1 });

    const examIds = [...new Set(results.map(r => r.examId))];
    const exams = await Exam.find({ _id: { $in: examIds } });
    const examMap = exams.reduce((acc, exam) => {
      acc[exam._id.toString()] = exam;
      return acc;
    }, {});

    const enriched = results.map(r => {
      const exam = examMap[r.examId.toString()];
      return {
        ...r.toObject(),
        examName: exam?.examName || "Unknown Exam",
        subject:  exam?.subject  || "",
        subCode:  exam?.subCode  || "",
        examDate: exam?.examDate || null,
      };
    });

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

/* ── DELETE a student's result + proctor logs for re-attempt ── */
router.delete("/results/exam/:examId/student/:studentId", authenticate, async (req, res) => {
  try {
    const { examId, studentId } = req.params;

    // 1. Verify exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    // 2. Auth check — only the teacher who created/owns the exam
    const userId = req.userId || (req.user && req.user._id);
    const isCreator = exam.createdBy && exam.createdBy.toString() === userId.toString();
    const isOwner = exam.teacherId && exam.teacherId.toString() === userId.toString();
    if (!isCreator && !isOwner && req.userRole !== 'principal') {
      return res.status(403).json({ success: false, message: "Only the exam creator can allow re-attempts" });
    }

    // 3. Delete result
    const resultDel = await Result.deleteMany({ examId, studentId });

    // 4. Delete proctoring logs
    const logsDel = await ProctorLog.deleteMany({ examId, studentId });

    // 5. Reset exam access code so student can re-enter
    await ExamAccess.updateMany(
      { examId, studentId },
      { $set: { used: false } }
    );

    console.log(`[RE-ATTEMPT] Cleared result (${resultDel.deletedCount}) and logs (${logsDel.deletedCount}) for student ${studentId} on exam ${examId}`);

    res.json({
      success: true,
      message: "Student's result and proctoring logs deleted. They can now re-attempt the exam.",
      deletedResults: resultDel.deletedCount,
      deletedLogs: logsDel.deletedCount
    });
  } catch (err) {
    console.error("RE-ATTEMPT DELETE ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to process re-attempt: " + err.message });
  }
});

module.exports = router;
