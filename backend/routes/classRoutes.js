const express = require("express");
const router = express.Router();
const Class = require("../models/Class");
const Result = require("../models/Result");
const ProctorLog = require("../models/ProctorLog");
const Exam = require("../models/Exam");
const ExamAccess = require("../models/ExamAccess");
const User = require("../models/User");
const Student = require("../models/Student");
const Organization = require("../models/Organization");
const Subject = require("../models/Subject");
const { authenticate } = require('../middleware/auth');

// ==============================
// CREATE CLASS
// ==============================
router.post("/classes", authenticate, async (req, res) => {
  try {
    const { className, semester, branch, year, description, maxStudents } = req.body;
    if (!className || !semester || !branch || !year) {
      return res.status(400).json({ success: false, message: "Required fields missing: Class name, Subject/Branch, Year, and Semester/Batch are mandatory." });
    }

    if (req.userRole === 'teacher' && req.userMode === 'organization') {
        if (!req.teacherProfile || req.teacherProfile.department !== branch) {
            return res.status(403).json({
                success: false,
                message: `Denied: You are only authorized to create classes for the ${req.teacherProfile?.department || 'assigned'} branch.`
            });
        }
    }

    const userId = req.userId || (req.user && req.user._id);
    const newClass = new Class({
      className, semester, branch, year,
      description, maxStudents,
      students: [], createdBy: userId,
      teacherId: userId, // Primary Isolation
      mode: req.userMode || 'solo',
      organizationId: req.organizationId || null,
      registrationOpen: true, status: 'active'
    });

    await newClass.save();

    // If solo mode, ensure a Subject record exists using 'branch' as name
    if (newClass.mode === 'solo') {
      try {
        await Subject.findOneAndUpdate(
          { name: branch, teacherId: userId },
          { 
            name: branch, 
            code: branch.substring(0, 3).toUpperCase() + Math.floor(100 + Math.random() * 900),
            teacherId: userId,
            branch: branch,
            semester: semester
          },
          { upsert: true, new: true }
        );
      } catch (subErr) {
        console.error("Failed to sync subject for solo class:", subErr);
      }
    }

    // Sync metadata to TeacherProfile
    const TeacherProfile = require('../models/TeacherProfile');
    const mongoose = require('mongoose');
    await TeacherProfile.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $addToSet: { classesCreated: newClass._id } }
    );

    res.status(201).json({ success: true, message: "Class created successfully", class: newClass });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/classes", authenticate, async (req, res) => {
  try {
    const userId = req.userId || (req.user && req.user._id);
    const orgId = req.organizationId || null;
    const { status } = req.query;

    let filter = {};
    if (req.userRole === 'principal' || (req.userRole === 'teacher' && req.userMode === 'organization')) {
      filter = { organizationId: orgId };
    } else {
      filter = { teacherId: userId, mode: 'solo' };
    }

    if (status) {
      filter.status = status;
    }

    const classes = await Class.find(filter).sort({ createdAt: -1 });
    res.json(classes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get("/class/:id", authenticate, async (req, res) => {
  try {
    const userId = req.userId || (req.user && req.user._id);
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    // Ownership check for solo mode
    if (cls.mode === 'solo' && cls.teacherId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized access to this class." });
    }

    res.json(cls);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post("/class/:id/clone", authenticate, async (req, res) => {
  try {
    const originalClass = await Class.findById(req.params.id);
    if (!originalClass) return res.status(404).json({ success: false, message: "Original class not found" });

    if (req.userRole === 'teacher' && req.userMode === 'organization') {
      if (!req.teacherProfile || req.teacherProfile.department !== originalClass.branch) {
        return res.status(403).json({ success: false, message: "Denied: You can only clone classes belonging to your branch." });
      }
    }

    const { newClassName } = req.body;
    const clonedClass = new Class({
      className: newClassName || `${originalClass.className} (Clone)`,
      semester: originalClass.semester,
      branch: originalClass.branch,
      students: [],
      createdBy: req.userId,
      mode: req.userMode,
      organizationId: req.organizationId,
      registrationOpen: true,
      status: 'active'
    });

    await clonedClass.save();

    // Sync metadata to TeacherProfile
    const TeacherProfile = require('../models/TeacherProfile');
    const mongoose = require('mongoose');
    await TeacherProfile.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(req.userId) },
      { $addToSet: { classesCreated: clonedClass._id } }
    );

    res.json({ success: true, message: "Class structure cloned successfully!", class: clonedClass });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/class/:id", authenticate, async (req, res) => {
    try {
        const { className, branch, semester, year } = req.body;
        const updatedClass = await Class.findByIdAndUpdate(req.params.id, { className, branch, semester, year }, { new: true });
        if (!updatedClass) return res.status(404).json({ success: false, message: "Class not found" });
        res.json({ success: true, message: "Class updated successfully", class: updatedClass });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete("/class/:id", authenticate, async (req, res) => {
    try {
        const cls = await Class.findById(req.params.id);
        if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

        const exams = await Exam.find({ classId: req.params.id });
        const examIds = exams.map(e => e._id);
        if (examIds.length > 0) {
            await Result.deleteMany({ examId: { $in: examIds } });
            await ProctorLog.deleteMany({ examId: { $in: examIds } });
            await ExamAccess.deleteMany({ examId: { $in: examIds } });
            await Exam.deleteMany({ classId: req.params.id });
        }

        // --- CASCADE DELETION FOR STUDENTS (SOLO MODE) ---
        if (cls.mode === 'solo') {
            const enrollmentsToDelete = cls.students.map(s => s.enrollment);
            
            for (const enrollment of enrollmentsToDelete) {
                // Check if student exists in ANY OTHER class by the same teacher
                const otherClasses = await Class.find({
                    teacherId: cls.teacherId,
                    _id: { $ne: cls._id },
                    "students.enrollment": enrollment
                });

                if (otherClasses.length === 0) {
                    // Orphaned student: delete Student profile and User account
                    const studentProfile = await Student.findOne({ enrollmentNo: enrollment });
                    if (studentProfile) {
                        await User.findByIdAndDelete(studentProfile.userId);
                        await Student.findByIdAndDelete(studentProfile._id);
                    }
                }
            }
        }
        // --------------------------------------------------

        await Class.findByIdAndDelete(req.params.id);

        // Sync metadata to TeacherProfile
        const TeacherProfile = require('../models/TeacherProfile');
        const mongoose = require('mongoose');
        await TeacherProfile.findOneAndUpdate(
          { userId: new mongoose.Types.ObjectId(req.userId) },
          { 
            $pull: { 
              classesCreated: req.params.id,
              examsCreated: { $in: examIds }
            } 
          }
        );

        res.json({ success: true, message: "Class and all related data deleted successfully" });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==============================
// PUBLIC JOIN CLASS INFO
// ==============================
router.get("/join-class-info/:classId", async (req, res) => {
  try {
    const cls = await Class.findById(req.params.classId);
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    // Validation checks for registration
    if (cls.status !== 'active') {
        return res.status(400).json({ success: false, message: `Registration closed. This class is ${cls.status}.` });
    }
    if (!cls.registrationOpen) {
        return res.status(400).json({ success: false, message: "Registration for this class has been closed by the teacher." });
    }
    if (cls.registrationDeadline && new Date() > new Date(cls.registrationDeadline)) {
        return res.status(400).json({ success: false, message: "Registration deadline has passed." });
    }

    let orgName = "Institution";
    if (cls.organizationId) {
      const org = await Organization.findById(cls.organizationId);
      if (org) orgName = org.organizationName;
    }

    res.json({
      success: true,
      className: cls.className,
      branch: cls.branch,
      semester: cls.semester,
      year: cls.year,
      mode: cls.mode,
      organizationName: orgName,
      maxStudents: cls.maxStudents,
      currentStudents: cls.students.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Student Management in Class
router.post("/class/join/:classId", async (req, res) => {
  try {
    const { rollNo, enrollment, name, password } = req.body;
    const { classId } = req.params;
    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ success: false, message: "Class not found" });

    // Validation checks for registration
    if (classDoc.status !== 'active') {
        return res.status(400).json({ success: false, message: `Registration closed. This class is ${classDoc.status}.` });
    }
    if (!classDoc.registrationOpen) {
        return res.status(400).json({ success: false, message: "Registration for this class has been closed by the teacher." });
    }
    if (classDoc.registrationDeadline && new Date() > new Date(classDoc.registrationDeadline)) {
        return res.status(400).json({ success: false, message: "Registration deadline has passed." });
    }

    const normalizedEnrollment = enrollment?.toString().trim().toUpperCase();
    if (!normalizedEnrollment || !name || !password) {
        return res.status(400).json({ success: false, message: "Incomplete data. Please fill all fields." });
    }

    // 0. Capacity Check
    if (classDoc.students.length >= classDoc.maxStudents) {
        return res.status(400).json({ 
            success: false, 
            message: `Class capacity reached (${classDoc.maxStudents}). Contact teacher for limit increase.` 
        });
    }

    // 1. Ensure User linkage exists (Scoped for Solo or Org)
    // Hardened uniqueness: enrollment@org-ID.online-exam.com ensures no cross-institution collisions
    const syntheticEmail = classDoc.mode === 'solo'
        ? `${normalizedEnrollment.toLowerCase()}@solo.exam.com`
        : `${normalizedEnrollment.toLowerCase()}@org-${classDoc.organizationId}.exam.com`;

    let user = await User.findOne({ email: syntheticEmail });
    
    if (!user) {
        // Fallback: In case they migrated from legacy @institution.com, try to bridge them
        // (Optional: for newly created users, always use the new pattern)
        user = await User.findOne({ 
            role: 'student', 
            mode: classDoc.mode, 
            organizationId: classDoc.organizationId,
            email: new RegExp(`^${normalizedEnrollment.toLowerCase()}@`, 'i')
        });

        if (!user) {
            user = new User({
                name,
                email: syntheticEmail,
                password,
                role: 'student',
                mode: classDoc.mode,
                organizationId: classDoc.organizationId
            });
            await user.save();
        }
    }

    // 2. Ensure Student Profile exists and is synced (Scoped for Solo)
    const studentFilter = { enrollmentNo: normalizedEnrollment };
    if (classDoc.mode === 'solo') {
        studentFilter.addedBy = classDoc.teacherId;
    } else {
        studentFilter.organizationId = classDoc.organizationId;
    }

    let studentProfile = await Student.findOne(studentFilter);
    if (!studentProfile) {
        studentProfile = new Student({
            userId: user._id,
            enrollmentNo: normalizedEnrollment,
            organizationId: classDoc.organizationId,
            currentSemester: classDoc.semester,
            branch: classDoc.branch,
            rollNo: Number(rollNo),
            addedBy: classDoc.teacherId
        });
        await studentProfile.save();
    } else {
        // Keep profile in sync
        studentProfile.currentSemester = classDoc.semester;
        studentProfile.branch = classDoc.branch;
        studentProfile.rollNo = Number(rollNo);
        if (!studentProfile.userId) studentProfile.userId = user._id;
        await studentProfile.save();
    }

    // 3. Check for existing registration in this specific class
    const exists = classDoc.students.find(st => st.enrollment === normalizedEnrollment);
    if (exists) {
        return res.status(400).json({ 
            success: false, 
            message: "This enrollment number is already registered for this particular class, semester, and year." 
        });
    }

    // 4. Update Class Roster
    classDoc.students.push({
        rollNo: Number(rollNo),
        enrollment: normalizedEnrollment,
        name,
        password,
        joinedAt: new Date()
    });

    await classDoc.save();
    res.json({ success: true, message: "Joined class successfully" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/class/import-students/:classId", authenticate, async (req, res) => {
  try {
    const { students } = req.body;
    const classDoc = await Class.findById(req.params.classId);
    if (!classDoc) return res.status(404).json({ success: false, message: "Class not found" });

    const results = { added: 0, updated: 0, errors: [] };

    for (const s of students) {
        try {
            const enrollment = s.enrollment?.toString().trim().toUpperCase();
            if (!enrollment || !s.name || !s.password) {
                results.errors.push(`Incomplete data for ${s.name || 'Unknown'}`);
                continue;
            }

            // 0. Capacity Check
            if (classDoc.students.length >= classDoc.maxStudents) {
                results.errors.push(`Capacity exceeded (${classDoc.maxStudents}). Could not add ${enrollment}.`);
                continue;
            }

            // 1. Ensure User linkage exists (Scoped for Solo)
            const syntheticEmail = classDoc.mode === 'solo'
                ? `${enrollment.toLowerCase()}@solo.exam.com`
                : `${enrollment.toLowerCase()}@org-${classDoc.organizationId}.exam.com`;

            let user = await User.findOne({ email: syntheticEmail });
            
            if (!user) {
                // Bridge fallback for legacy @institution.com users
                user = await User.findOne({ 
                    role: 'student', 
                    mode: classDoc.mode, 
                    organizationId: classDoc.organizationId,
                    email: new RegExp(`^${enrollment.toLowerCase()}@`, 'i')
                });

                if (!user) {
                    user = new User({
                        name: s.name,
                        email: syntheticEmail,
                        password: s.password,
                        role: 'student',
                        mode: classDoc.mode,
                        organizationId: classDoc.organizationId
                    });
                    await user.save();
                }
            }

            // 2. Ensure Student Profile exists and is synced (Scoped for Solo)
            const studentFilter = { enrollmentNo: enrollment };
            if (classDoc.mode === 'solo') {
                studentFilter.addedBy = classDoc.teacherId;
            } else {
                studentFilter.organizationId = classDoc.organizationId;
            }

            let studentProfile = await Student.findOne(studentFilter);
            if (!studentProfile) {
                studentProfile = new Student({
                    userId: user._id,
                    enrollmentNo: enrollment,
                    organizationId: classDoc.organizationId,
                    currentSemester: classDoc.semester,
                    branch: classDoc.branch,
                    rollNo: Number(s.rollNo),
                    addedBy: req.userId
                });
                await studentProfile.save();
                results.added++;
            } else {
                studentProfile.currentSemester = classDoc.semester;
                studentProfile.branch = classDoc.branch;
                studentProfile.rollNo = Number(s.rollNo);
                if (!studentProfile.userId) studentProfile.userId = user._id;
                await studentProfile.save();
                results.updated++;
            }

            // 3. Update Class Roster
            const exists = classDoc.students.find(st => st.enrollment === enrollment);
            if (!exists) {
                classDoc.students.push({
                    rollNo: Number(s.rollNo),
                    enrollment: enrollment,
                    name: s.name,
                    password: s.password,
                    joinedAt: new Date()
                });
            } else {
                exists.rollNo = Number(s.rollNo);
                exists.name = s.name;
                exists.password = s.password;
            }
        } catch (err) {
            results.errors.push(`Error processing ${s.enrollment}: ${err.message}`);
        }
    }

    await classDoc.save();
    res.json({ 
        success: true, 
        message: `Import finalized. Total Students in Class: ${classDoc.students.length}`,
        added: results.added,
        updated: results.updated,
        errors: results.errors 
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete("/class/:id/student/:enrollment", authenticate, async (req, res) => {
    try {
        const cls = await Class.findById(req.params.id);
        if (!cls) return res.status(404).json({ success: false, message: "Class not found" });
        
        const initialCount = cls.students.length;
        cls.students = cls.students.filter(s => s.enrollment !== req.params.enrollment);
        
        if (cls.students.length === initialCount) {
            return res.status(404).json({ success: false, message: "Student not found in this class" });
        }

        await cls.save();
        res.json({ success: true, message: "Student removed from class successfully" });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/class/:id/org-students", authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { query } = req.query;
        const cls = await Class.findById(id);
        if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

        const orgId = req.organizationId;
        if (!orgId) return res.status(403).json({ success: false, message: "Organization context missing" });

        // Get enrollments already in class
        const existingEnrollments = cls.students.map(s => s.enrollment);

        // Build filter for students in organization not in this class
        let filter = { 
            organizationId: orgId,
            enrollmentNo: { $nin: existingEnrollments },
            status: 'active'
        };

        const students = await Student.find(filter).populate('userId');
        
        // Filter by search query if provided
        let filteredStudents = students;
        if (query) {
            const q = query.toLowerCase();
            filteredStudents = students.filter(s => 
                s.enrollmentNo.toLowerCase().includes(q) || 
                (s.userId?.name && s.userId.name.toLowerCase().includes(q))
            );
        }

        res.json({ success: true, students: filteredStudents });
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
});

router.post("/class/:classId/add-org-students", authenticate, async (req, res) => {
    try {
        const { classId } = req.params;
        const { studentEnrollments } = req.body;
        const cls = await Class.findById(classId);
        if (!cls) return res.status(404).json({ success: false, message: "Class not found" });
        const studentsToFetch = await Student.find({ enrollmentNo: { $in: studentEnrollments }, organizationId: req.organizationId }).populate('userId');
        let addedCount = 0;
        for (let sItem of studentsToFetch) {
            if (!cls.students.find(s => s.enrollment === sItem.enrollmentNo)) {
                cls.students.push({ rollNo: cls.students.length + 1, enrollment: sItem.enrollmentNo, name: sItem.userId?.name || "Unknown", password: "OrgUser", joinedAt: new Date() });
                addedCount++;
            }
        }
        await cls.save();
        res.json({ success: true, message: `Successfully added ${addedCount} students to class.` });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ==============================
// BULK CLASS PROMOTION
// ==============================
router.post("/classes/bulk-promote", authenticate, async (req, res) => {
    try {
        const { classIds, newSemester, newYear } = req.body;
        if (!classIds || !Array.isArray(classIds) || !newSemester) {
            return res.status(400).json({ success: false, message: "Required fields missing: Class list and Target Semester." });
        }

        const Student = require('../models/Student');
        const results = { classesPromoted: 0, studentsPromoted: 0, errors: [] };

        for (const classId of classIds) {
            try {
                const cls = await Class.findById(classId);
                if (!cls) continue;

                // 1. Identify exams specifically for this class to isolate results
                const classExamIds = await Exam.find({ classId: cls._id }).distinct('_id');

                // 2. Promote each student profile linked to this organization
                const enrollments = cls.students.map(s => s.enrollment);
                const students = await Student.find({ 
                    enrollmentNo: { $in: enrollments },
                    organizationId: req.organizationId,
                    status: 'active'
                });

                for (let student of students) {
                    // FETCH RESULTS ONLY FOR EXAMS BELONGING TO THIS CLASS (Isolation Fix)
                    const studentResults = await Result.find({ 
                        studentId: student.enrollmentNo,
                        examId: { $in: classExamIds }
                    });

                    const examResultsList = [];
                    for (let r of studentResults) {
                        const exam = await Exam.findById(r.examId);
                        examResultsList.push({
                            examId: r.examId,
                            examName: exam?.examName || "Unknown",
                            subject: exam?.subject || "Unknown",
                            score: r.score,
                            totalMarks: r.totalMarks,
                            percentage: r.percentage,
                            grade: r.grade
                        });
                    }

                    // Save history snapshot using OLD class metadata (Integrity Fix)
                    const historySemester = cls.semester;
                    const historyYear = cls.year;
                    
                    const alreadyExists = student.academicHistory.find(h => 
                        h.semester === historySemester && 
                        h.year === historyYear
                    );

                    if (!alreadyExists) {
                        student.academicHistory.push({
                            year: historyYear,
                            semester: historySemester,
                            classes: [cls._id],
                            examResults: examResultsList,
                            completedAt: new Date()
                        });
                    }
                    
                    student.currentSemester = newSemester;
                    if (newYear) student.currentYear = newYear;
                    await student.save();
                    results.studentsPromoted++;
                }

                // 3. Create new class instance for next semester
                const newClass = new Class({
                    className: cls.className,
                    semester: newSemester,
                    branch: cls.branch,
                    year: newYear || cls.year,
                    description: cls.description,
                    maxStudents: cls.maxStudents,
                    students: cls.students,
                    createdBy: cls.createdBy,
                    teacherId: cls.teacherId,
                    mode: cls.mode,
                    organizationId: cls.organizationId,
                    registrationOpen: false,
                    status: 'active'
                });
                await newClass.save();

                // 4. Mark old instance as completed
                cls.status = 'completed';
                await cls.save();
                results.classesPromoted++;

            } catch (err) {
                results.errors.push(`Error promoting class ${classId}: ${err.message}`);
            }
        }

        res.json({ 
            success: true, 
            message: `Bulk promotion finalized.`,
            stats: results
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;