const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Exam = require("../models/Exam");
const ExamAccess = require("../models/ExamAccess");
const Class = require("../models/Class");
const Question = require("../models/Question");
const { authenticate } = require('../middleware/auth');

// 1. Specific named POST routes first

/* ======================
CREATE EXAM
====================== */
router.post("/exams", authenticate, async (req, res) => {
  try {
    const {
      examName, branch, year, semester, subject, subCode,
      examDate, totalQuestions, duration, marksPerQuestion, totalMarks, classId
    } = req.body;

    if (!examName || !branch || !year || !semester || !subject || !subCode || !examDate || !classId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const userId = req.userId || (req.user && req.user._id);
    const organizationId = req.organizationId || null;

    const exam = new Exam({
      examName, branch, year, semester, subject, subCode,
      examDate: new Date(examDate),
      totalQuestions: Number(totalQuestions) || 0,
      marksPerQuestion: Number(marksPerQuestion) || 1,
      duration: Number(duration) || 0,
      totalMarks: Number(totalMarks) || 0,
      classId,
      isPublished: false,
      createdBy: userId,
      organizationId: organizationId,
      visibility: req.body.visibility || (organizationId ? (req.userMode === 'organization' ? 'organization' : 'private') : 'private'),
      editableBy: 'creator_only',
      status: 'draft',
      isArchived: false
    });

    if (organizationId) {
      const Organization = require('../models/Organization');
      const org = await Organization.findById(organizationId);
      
      if (org) {
        // Add all other teachers with view permission
        exam.sharedWithTeachers = org.teachers
          .filter(t => t.userId.toString() !== userId.toString())
          .map(t => ({
            teacherId: t.userId,
            permission: 'view'
          }));
      }
    }

    await exam.save();

    // Sync metadata to TeacherProfile
    const TeacherProfile = require('../models/TeacherProfile');
    await TeacherProfile.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $addToSet: { examsCreated: exam._id } }
    );

    res.status(201).json({ success: true, message: "Exam created successfully", exam });
  } catch (err) {
    console.error("CREATE EXAM ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ======================
GENERATE STUDENT CODES
====================== */
router.post("/exams/generate-codes/:examId", async (req, res) => {
  try {
    const examId = req.params.examId;
    const { classId } = req.body;

    const classData = await Class.findById(classId);
    if (!classData) return res.status(404).json({ message: "Class not found" });

    const students = classData.students;
    if (!students.length) return res.json([]);

    await ExamAccess.deleteMany({ examId });

    const codes = [];
    for (const student of students) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const access = new ExamAccess({
        examId, studentId: student.enrollment, accessCode: code, used: false
      });
      await access.save();
      codes.push({ studentName: student.name, studentId: student.enrollment, code });
    }
    res.json(codes);
  } catch (err) {
    console.error("GENERATE CODES ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ======================
VERIFY EXAM CODE
====================== */
router.post("/exams/verify-code", async (req, res) => {
  try {
    const { examId, code, studentId } = req.body;

    if (!examId || !code) {
      return res.status(400).json({ success: false, message: "examId and code are required" });
    }

    const cleanCode = code.trim();

    let examObjectId;
    try {
      examObjectId = new mongoose.Types.ObjectId(examId);
    } catch (e) {
      return res.status(400).json({ success: false, message: "Invalid exam ID format" });
    }

    const access = await ExamAccess.findOne({ examId: examObjectId, accessCode: cleanCode });

    if (access) {
      if (access.used) {
        return res.status(400).json({ success: false, message: "Code already used. Contact your teacher." });
      }
      if (studentId && access.studentId && access.studentId !== studentId) {
        return res.status(400).json({ success: false, message: "Code mismatch for student." });
      }
      access.used = true;
      await access.save();
      return res.json({ success: true, message: "Code Verified" });
    }

    const exam = await Exam.findById(examObjectId);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    if (exam.examCode && exam.examCode.trim() === cleanCode) {
      return res.json({ success: true, message: "Code Verified" });
    }

    return res.status(400).json({ success: false, message: "Invalid code. Please check and try again." });
  } catch (err) {
    console.error("VERIFY CODE ERROR:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
});

/* ======================
SUBMIT EXAM
====================== */
router.post("/exams/submit", async (req, res) => {
  try {
    const { examId, answers, studentId } = req.body;

    const Result = require("../models/Result");

    const questions = await Question.find({ examId });
    const exam = await Exam.findById(examId);

    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Prevent duplicate submissions
    const existing = await Result.findOne({ examId, studentId });
    if (existing) {
      return res.json({
        success: true,
        score: existing.score,
        total: existing.totalMarks,
        alreadySubmitted: true
      });
    }

    const marksPerQuestion = exam.marksPerQuestion || (exam.totalMarks / exam.totalQuestions);
    let score = 0, correct = 0, wrong = 0, unattempted = 0;

    questions.forEach((q) => {
      const studentAnswer = answers[q._id.toString()];

      if (!studentAnswer || studentAnswer.trim() === "") {
        unattempted++;
      } else {
        // ✅ Normalize both sides: trim + lowercase + collapse spaces
        // This handles leading/trailing spaces AND mid-word truncation won't match
        const normalize = (str) => str.trim().toLowerCase().replace(/\s+/g, " ");
        const sAns = normalize(studentAnswer);
        const cAns = normalize(q.correctAnswer);

        if (sAns === cAns) {
          correct++;
          score += marksPerQuestion;
        } else {
          wrong++;
        }
      }
    });

    score = Math.round(score * 100) / 100;
    const percentage = Math.round((score / exam.totalMarks) * 100);
    let grade = "F";
    if (percentage >= 90) grade = "A";
    else if (percentage >= 75) grade = "B";
    else if (percentage >= 60) grade = "C";
    else if (percentage >= 45) grade = "D";

    // Get student name and academic context from Class/Student
    let studentName = studentId;
    let studentSemester = "";
    let studentYear = "";

    try {
      const classData = await Class.findById(exam.classId);
      if (classData) {
        const found = classData.students.find((s) => s.enrollment === studentId);
        if (found) {
          studentName = found.name;
          // Fallback context from class if not in Student model
          studentSemester = classData.semester;
          studentYear = classData.year;
        }
      }

      // Try to get precise context from Student profile (especially for Org mode)
      const Student = require("../models/Student");
      const studentProfile = await Student.findOne({ enrollmentNo: studentId });
      if (studentProfile) {
        if (studentProfile.currentSemester) studentSemester = studentProfile.currentSemester;
        if (studentProfile.currentYear) studentYear = studentProfile.currentYear;
      }
    } catch (e) { }

    const result = new Result({
      examId,
      studentId,
      studentName,
      semester: studentSemester,
      year: studentYear,
      answers,
      score,
      totalMarks: exam.totalMarks,
      correct,
      wrong,
      unattempted,
      percentage,
      grade,
      submittedAt: new Date()
    });

    await result.save();

    // ✅ Return both `score` and `total` — AttemptExamPage uses result.total
    res.json({
      success: true,
      score,
      total: exam.totalMarks,
      correct,
      wrong,
      unattempted,
      percentage,
      grade
    });

  } catch (err) {
    console.error("SUBMIT ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Specific named GET routes

/* ======================
GET ALL EXAMS (Filtered by Role/Mode/Visibility)
====================== */
router.get("/exams", authenticate, async (req, res) => {
  try {
    const userId = req.userId || (req.user && req.user._id);
    const orgId = req.organizationId || null;
    let filter = {};

    // Logic for returning exams
    // 1. If Principal: See all exams in their organization
    if (req.userRole === 'principal') {
        filter = { organizationId: orgId };
    } 
    // 2. If Teacher in Organization: See exams they created OR exams shared with them in org
    else if (req.userRole === 'teacher' && req.userMode === 'organization') {
        filter = { 
            $or: [
                { createdBy: userId },
                { 
                  organizationId: orgId, 
                  visibility: 'organization'
                }
            ]
        };
    } 
    // 3. If Solo Teacher: See ONLY their own exams
    else if (req.userRole === 'teacher' && req.userMode === 'solo') {
         filter = { createdBy: userId, mode: 'solo' };
    }
    // 4. If Student: Shouldn't use this route typically, but if so, only see published exams they have access to

    const exams = await Exam.find(filter).sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    console.error("GET EXAMS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ======================
GET EXAMS FOR STUDENT
====================== */
router.get("/exams/student/:classId", async (req, res) => {
  try {
    const exams = await Exam.find({
      classId: req.params.classId,
      isPublished: true
    }).sort({ examDate: 1 });
    res.json(exams);
  } catch (err) {
    console.error("STUDENT EXAMS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// 3. Specific named PUT routes

/* ======================
PUBLISH / UNPUBLISH
====================== */
router.put("/exams/toggle-publish/:id", authenticate, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    // Authorization: Only creator or principal
    const userId = req.userId || (req.user && req.user._id);
    if (exam.createdBy.toString() !== userId.toString() && req.userRole !== 'principal') {
      return res.status(403).json({ success: false, message: "Not authorized to publish this exam" });
    }

    // Toggle logic
    if (!exam.isPublished) {
      // Check if questions exist before publishing
      const questionCount = await Question.countDocuments({ examId: req.params.id });
      if (questionCount === 0) {
        return res.status(400).json({ success: false, message: "Cannot publish an exam with no questions. Please add content first." });
      }
      exam.isPublished = true;
      exam.status = 'published';
    } else {
      exam.isPublished = false;
      exam.status = 'draft';
    }
    
    await exam.save();

    res.json({
      success: true,
      message: exam.isPublished ? "Exam Published Successfully" : "Exam moved to Drafts",
      isPublished: exam.isPublished,
      status: exam.status,
      exam
    });
  } catch (err) {
    console.error("TOGGLE PUBLISH ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Generic parameter routes LAST

/* ======================
GET SINGLE EXAM
====================== */
router.get("/exams/:id", authenticate, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    // Authorization Check
    const userId = req.userId || (req.user && req.user._id);
    if (req.userRole === 'teacher') {
       const isCreator = exam.createdBy && exam.createdBy.toString() === userId.toString();
       const isShared = exam.sharedWithTeachers && exam.sharedWithTeachers.some(t => t.teacherId.toString() === userId.toString());
       
       if (!isCreator && !isShared && req.userRole !== 'principal') {
           return res.status(403).json({ success: false, message: "You do not have permission to view this exam."});
       }
    }

    res.json(exam);
  } catch (err) {
    console.error("GET EXAM ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ======================
UPDATE EXAM
====================== */
router.put("/exams/:id", authenticate, async (req, res) => {
  try {
    let exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    // Enforce creator_only editing
    const userId = req.userId || (req.user && req.user._id);
    const isCreator = exam.createdBy && exam.createdBy.toString() === userId.toString();

    // Principals can also edit, but other teachers cannot unless editableBy says so (currently only creator_only supported)
    if (!isCreator && req.userRole !== 'principal') {
         return res.status(403).json({ success: false, message: "Only creator can edit this exam" });
    }

    exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: "Exam updated successfully", exam });
  } catch (err) {
    console.error("UPDATE EXAM ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ======================
DELETE EXAM — cascade delete questions, results, proctorlogs, examaccesses
====================== */
router.delete("/exams/:id", authenticate, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const examId = req.params.id;
    let exam = await Exam.findById(examId).session(session);
    
    if (!exam) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    // Authorization logic
    const userId = req.userId || (req.user && req.user._id);
    const isCreator = exam.createdBy && exam.createdBy.toString() === userId.toString();
    if (!isCreator && req.userRole !== 'principal') {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: "Only creator can delete this exam" });
    }

    // Capture metadata for logging before deletion
    const examInfo = {
      id: exam._id,
      name: exam.examName,
      subject: exam.subject,
      createdBy: exam.createdBy,
      deletedBy: userId,
      at: new Date().toISOString()
    };

    // findOneAndDelete triggers the pre-hook in Exam.js for cascade delete
    await Exam.findByIdAndDelete(examId).session(session);

    // Sync metadata to TeacherProfile
    const TeacherProfile = require('../models/TeacherProfile');
    await TeacherProfile.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $pull: { examsCreated: examId } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    console.log(`[EXAM DELETED] Transaction committed. Details:`, examInfo);
    res.json({ success: true, message: "Exam and all related data deleted successfully" });
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error("DELETE EXAM ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to delete exam: " + err.message });
  }
});

/* ======================
CLONE EXAM
====================== */
router.post("/exams/clone/:id", authenticate, async (req, res) => {
  try {
    const originalExam = await Exam.findById(req.params.id);
    if (!originalExam) return res.status(404).json({ success: false, message: "Exam not found" });

    const userId = req.userId || (req.user && req.user._id);
    
    // Create new exam object (stripping IDs)
    const cloneData = originalExam.toObject();
    delete cloneData._id;
    delete cloneData.createdAt;
    delete cloneData.updatedAt;
    
    // Set new owner and metadata
    cloneData.examName = `${cloneData.examName} (Copy)`;
    cloneData.createdBy = userId;
    cloneData.isPublished = false;
    cloneData.status = 'draft';
    cloneData.isArchived = false;

    // Organization context
    if (req.userMode === 'organization') {
        cloneData.organizationId = req.organizationId;
        cloneData.visibility = 'private'; // Start copies as private
    } else {
        cloneData.organizationId = null;
        cloneData.visibility = 'private';
    }

    const newExam = new Exam(cloneData);
    await newExam.save();

    // Sync metadata to TeacherProfile
    const TeacherProfile = require('../models/TeacherProfile');
    const mongoose = require('mongoose');
    await TeacherProfile.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $addToSet: { examsCreated: newExam._id } }
    );

    // Clone questions
    const questions = await Question.find({ examId: req.params.id });
    for (let q of questions) {
        const qData = q.toObject();
        delete qData._id;
        qData.examId = newExam._id;
        const newQ = new Question(qData);
        await newQ.save();
    }

    res.status(201).json({ success: true, message: "Exam cloned successfully", exam: newExam });
  } catch (err) {
    console.error("CLONE EXAM ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;