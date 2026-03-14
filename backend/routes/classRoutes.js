const express = require("express");
const router = express.Router();
const Class = require("../models/Class");
const Result = require("../models/Result");
const ProctorLog = require("../models/ProctorLog");
const Exam = require("../models/Exam");
const ExamAccess = require("../models/ExamAccess");
const { authenticate } = require('../middleware/auth');


// ==============================
// CREATE CLASS
// ==============================
router.post("/classes", authenticate, async (req, res) => {
  try {
    const { className, semester, branch, year } = req.body;


    if (!className || !semester || !branch || !year) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const userId = req.userId || (req.user && req.user._id);

    const newClass = new Class({
      className,
      semester,
      branch,
      year,
      students: [],
      createdBy: userId,
      mode: req.userMode || 'solo',
      organizationId: req.organizationId || null,
      registrationOpen: true,
      status: 'active'
    });

    await newClass.save();

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      class: newClass,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================
// GET ALL CLASSES
// ==============================
router.get("/classes", async (req, res) => {
  try {
    const classes = await Class.find().sort({ createdAt: -1 });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// GET SINGLE CLASS BY ID
// ==============================
router.get("/class/:id", async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    res.json(cls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// JOIN CLASS (WITH ROLL NO)
// ==============================
router.post("/class/join/:classId", async (req, res) => {
  try {
    const { rollNo, enrollment, name, password } = req.body;
    const { classId } = req.params;

    if (!rollNo || !enrollment || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "Roll No, enrollment, name and password are required",
      });
    }

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    const enrollmentExists = await Class.findOne({ "students.enrollment": enrollment });
    if (enrollmentExists) {
      return res.status(400).json({
        success: false,
        message: "This enrollment number has already joined a class",
      });
    }

    const rollExists = cls.students.find((s) => s.rollNo === Number(rollNo));
    if (rollExists) {
      return res.status(400).json({
        success: false,
        message: "This roll number already exists in this class",
      });
    }

    const alreadyJoined = cls.students.find((s) => s.enrollment === enrollment);
    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: "Student already joined this class",
      });
    }

    cls.students.push({ rollNo: Number(rollNo), enrollment, name, password, joinedAt: new Date() });
    await cls.save();

    res.json({ success: true, message: "Joined class successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================
// IMPORT STUDENTS FROM EXCEL
// ==============================
router.post("/class/import-students/:classId", async (req, res) => {
  try {
    const { students } = req.body;
    const classDoc = await Class.findById(req.params.classId);
    if (!classDoc) return res.status(404).json({ success: false, message: "Class not found" });

    const existing = new Set(classDoc.students.map((s) => s.enrollment));
    const newStudents = students.filter((s) => !existing.has(String(s.enrollment)));

    classDoc.students.push(
      ...newStudents.map((s) => ({
        rollNo: Number(s.rollNo),
        enrollment: String(s.enrollment).trim(),
        name: String(s.name).trim(),
        password: String(s.password).trim(),
        joinedAt: new Date(),
      }))
    );

    await classDoc.save();

    res.json({
      success: true,
      added: newStudents.length,
      skipped: students.length - newStudents.length,
      message: `${newStudents.length} students imported. ${students.length - newStudents.length} duplicates skipped.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================
// UPDATE CLASS (EDIT)
// ==============================
router.put("/class/:id", async (req, res) => {
  try {
    const { className, branch, year, semester } = req.body;

    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      { className, branch, year, semester },
      { new: true }
    );

    if (!updatedClass) return res.status(404).json({ success: false, message: "Class not found" });

    res.json({ success: true, message: "Class updated successfully", class: updatedClass });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// DELETE CLASS — cascade delete exams, results, proctorlogs, examaccesses
// ==============================
router.delete("/class/:id", async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    // 1. Is class ke saare exams dhundo
    const exams = await Exam.find({ classId: req.params.id });
    const examIds = exams.map((e) => e._id);

    if (examIds.length > 0) {
      // 2. Un exams ke results delete karo
      await Result.deleteMany({ examId: { $in: examIds } });
      // 3. Un exams ke proctorlogs delete karo
      await ProctorLog.deleteMany({ examId: { $in: examIds } });
      // 4. Un exams ke examaccesses delete karo
      await ExamAccess.deleteMany({ examId: { $in: examIds } });
      // 5. Exams khud delete karo
      await Exam.deleteMany({ classId: req.params.id });
    }

    // 6. Class delete karo
    await Class.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Class and all related data deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// DELETE STUDENT FROM CLASS — cascade delete results + proctorlogs
// ==============================
router.delete("/class/:classId/student/:studentId", async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    // Student ka enrollment number nikalo pehle (studentId yahan subdocument _id hai)
    const student = cls.students.find((s) => s._id.toString() === studentId);
    if (!student) return res.status(404).json({ message: "Student not found in class" });

    const enrollment = student.enrollment;

    // Is class ke exam IDs nikalo
    const exams = await Exam.find({ classId });
    const examIds = exams.map((e) => e._id);

    // Results delete — is student ke, sirf is class ke exams ke
    if (examIds.length > 0) {
      await Result.deleteMany({ studentId: enrollment, examId: { $in: examIds } });
      await ProctorLog.deleteMany({ studentId: enrollment, examId: { $in: examIds } });
      await ExamAccess.deleteMany({ studentId: enrollment, examId: { $in: examIds } });
    }

    // Student ko class se remove karo
    cls.students = cls.students.filter((s) => s._id.toString() !== studentId);
    await cls.save();

    res.json({
      success: true,
      message: `Student ${enrollment} and all related data deleted successfully`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;