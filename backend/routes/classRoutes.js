const express = require("express");
const router = express.Router();
const Class = require("../models/Class");
const Result = require("../models/Result");
const ProctorLog = require("../models/ProctorLog");
const Exam = require("../models/Exam");
const ExamAccess = require("../models/ExamAccess");
const User = require("../models/User");
const Student = require("../models/Student");
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
// GET ALL CLASSES (Filtered)
// ==============================
router.get("/classes", authenticate, async (req, res) => {
  try {
    const userId = req.userId || (req.user && req.user._id);
    const orgId = req.organizationId || null;
    let filter = {};

    if (req.userRole === 'principal') {
      filter = { organizationId: orgId };
    } else if (req.userRole === 'teacher' && req.userMode === 'organization') {
      filter = { organizationId: orgId };
    } else if (req.userRole === 'teacher' && req.userMode === 'solo') {
      filter = { createdBy: userId, mode: 'solo' };
    }

    const classes = await Class.find(filter).sort({ createdAt: -1 });
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

    // Sync with Organization pool
    if (cls.mode === 'organization' && cls.organizationId) {
      try {
        const studentEmail = `${enrollment.toLowerCase()}@institution.com`;
        let studentUser = await User.findOne({ email: studentEmail });
        
        if (!studentUser) {
          studentUser = new User({
            name,
            email: studentEmail,
            password,
            role: 'student',
            mode: 'organization',
            organizationId: cls.organizationId
          });
          await studentUser.save();

          const studentProfile = new Student({
            userId: studentUser._id,
            enrollmentNo: enrollment,
            organizationId: cls.organizationId,
            branch: cls.branch,
            currentSemester: cls.semester,
            currentYear: cls.year,
            addedBy: cls.createdBy
          });
          await studentProfile.save();
        }
      } catch (syncErr) {
        console.error("Sync error in join class:", syncErr);
      }
    }

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

    // Sync with Organization Student pool if in Org mode
    if (classDoc.mode === 'organization' && classDoc.organizationId) {
      for (const s of newStudents) {
        try {
          // Check if User exists by enrollment-based email
          const studentEmail = `${s.enrollment.toLowerCase()}@institution.com`;
          let studentUser = await User.findOne({ email: studentEmail });
          
          if (!studentUser) {
            studentUser = new User({
              name: s.name,
              email: studentEmail,
              password: s.password, // bcrypt hash handled by pre-save
              role: 'student',
              mode: 'organization',
              organizationId: classDoc.organizationId
            });
            await studentUser.save();

            const studentProfile = new Student({
              userId: studentUser._id,
              enrollmentNo: s.enrollment,
              organizationId: classDoc.organizationId,
              branch: classDoc.branch,
              currentSemester: classDoc.semester,
              currentYear: classDoc.year,
              addedBy: classDoc.createdBy
            });
            await studentProfile.save();
          }
        } catch (syncErr) {
          console.error(`Failed to sync student ${s.enrollment}:`, syncErr);
        }
      }
    }

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

// ==============================
// SEARCH ORG STUDENTS (Not in this class)
// ==============================
router.get("/class/:classId/org-students", authenticate, async (req, res) => {
  try {
    const { classId } = req.params;
    const { query } = req.query; // Search by name/enrollment
    const Student = require("../models/Student");

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    const existingEnrollments = cls.students.map(s => s.enrollment);

    let filter = {
      organizationId: req.organizationId,
      enrollmentNo: { $nin: existingEnrollments }
    };

    let students = await Student.find(filter)
      .populate('userId', 'name email')
      .limit(20);

    if (query) {
      students = students.filter(s => 
        s.userId?.name.toLowerCase().includes(query.toLowerCase()) || 
        s.enrollmentNo.toLowerCase().includes(query.toLowerCase())
      );
    }

    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==============================
// ADD ORG STUDENTS TO CLASS
// ==============================
router.post("/class/:classId/add-org-students", authenticate, async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentEnrollments } = req.body; // Array of enrollments
    const Student = require("../models/Student");

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    const studentsToFetch = await Student.find({
      enrollmentNo: { $in: studentEnrollments },
      organizationId: req.organizationId
    }).populate('userId');

    let addedCount = 0;
    for (let sItem of studentsToFetch) {
      if (!cls.students.find(s => s.enrollment === sItem.enrollmentNo)) {
        cls.students.push({
          rollNo: cls.students.length + 1, // Auto-assign next roll no
          enrollment: sItem.enrollmentNo,
          name: sItem.userId?.name || "Unknown",
          password: "OrgUser", // Placeholder since we use central auth for org students
          joinedAt: new Date()
        });
        addedCount++;
      }
    }

    await cls.save();
    res.json({ success: true, message: `Successfully added ${addedCount} students to class.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;