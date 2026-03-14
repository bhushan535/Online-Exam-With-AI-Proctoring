const express = require('express');
const router = express.Router();
const { authenticate, isPrincipal } = require('../middleware/auth');
const User = require('../models/User');
const TeacherProfile = require('../models/TeacherProfile');
const Organization = require('../models/Organization');

router.use(authenticate, isPrincipal);

router.post('/teacher/add', async (req, res) => {
  try {
    const { name, email, password, department, employeeId } = req.body;

    // Get organization
    const organization = await Organization.findById(req.organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Check if email exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create teacher user
    const teacherUser = new User({
      name,
      email,
      password,
      role: 'teacher',
      mode: 'organization',
      organizationId: organization._id,
    });
    await teacherUser.save();

    // Create teacher profile
    const teacherProfile = new TeacherProfile({
      userId: teacherUser._id,
      mode: 'organization',
      organizationId: organization._id,
      department,
      employeeId,
    });
    await teacherProfile.save();

    // Add to organization
    organization.teachers.push({
      userId: teacherUser._id,
      department,
      employeeId,
    });
    await organization.save();

    res.status(201).json({
      success: true,
      message: 'Teacher added successfully',
      teacher: {
        id: teacherUser._id,
        name: teacherUser.name,
        email: teacherUser.email,
        department,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get('/teachers', async (req, res) => {
  try {
    const organization = await Organization.findById(req.organizationId)
      .populate({
        path: 'teachers.userId',
        select: 'name email status',
      });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    res.json({
      success: true,
      teachers: organization.teachers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post('/teacher/toggle-status/:teacherId', async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    const user = await User.findById(teacherId);

    if (!user || user.organizationId.toString() !== req.organizationId.toString()) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    user.status = user.status === 'active' ? 'suspended' : 'active';
    await user.save();

    res.json({
      success: true,
      message: `Teacher account ${user.status}`,
      status: user.status
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/students', async (req, res) => {
  try {
    const Student = require('../models/Student');
    const { search, branch, semester } = req.query;
    
    let filter = { organizationId: req.organizationId };
    
    if (branch) filter.branch = branch;
    if (semester) filter.currentSemester = Number(semester);
    
    let students = await Student.find(filter)
      .populate('userId', 'name email')
      .sort({ rollNo: 1 });

    if (search) {
      students = students.filter(s => 
        s.userId?.name.toLowerCase().includes(search.toLowerCase()) || 
        s.rollNo.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({
      success: true,
      students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get('/organization', async (req, res) => {
  try {
    const organization = await Organization.findById(req.organizationId);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }
    res.json({ success: true, organization });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/organization', async (req, res) => {
  try {
    const { name, type, address, logo, settings } = req.body;
    const organization = await Organization.findByIdAndUpdate(
      req.organizationId,
      { name, type, address, logo, settings },
      { new: true }
    );
    res.json({ success: true, message: 'Organization updated', organization });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/promote-students', async (req, res) => {
  try {
    const { currentSemester, newSemester, branch, currentYear, newYear } = req.body;
    const Student = require('../models/Student');
    const Class = require('../models/Class');

    // 1. Find all students matching criteria in this org
    const students = await Student.find({
      organizationId: req.organizationId,
      currentSemester,
      branch,
      status: 'active'
    });

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found to promote' });
    }

    // 2. Perform bulk promotion
    for (let student of students) {
      // Find classes this student is currently in (in this branch/semester)
      const currentClasses = await Class.find({
        organizationId: req.organizationId,
        semester: currentSemester,
        branch,
        status: 'active',
        'students.enrollment': student.enrollmentNo
      });

      // Archive current sem info with class links
      student.academicHistory.push({
        year: student.currentYear,
        semester: student.currentSemester,
        classes: currentClasses.map(c => c._id),
        completedAt: new Date()
      });

      // Update current info
      student.currentSemester = newSemester;
      if (newYear) student.currentYear = newYear;
      await student.save();
    }

    // 3. Mark all classes of this sem/branch as completed (archive them)
    await Class.updateMany(
      { organizationId: req.organizationId, semester: currentSemester, branch, status: 'active' },
      { $set: { status: 'completed' } }
    );

    res.json({ 
      success: true, 
      message: `Successfully promoted ${students.length} students to ${newSemester} and archived their data.`
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const organization = await Organization.findById(req.organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    const Class = require('../models/Class');
    const Exam = require('../models/Exam');

    const totalTeachers = organization.teachers.length;
    const totalStudents = organization.students.length;

    const totalClasses = await Class.countDocuments({
      organizationId: req.organizationId,
    });

    const totalExams = await Exam.countDocuments({
      organizationId: req.organizationId,
    });

    res.json({
      success: true,
      stats: {
        totalTeachers,
        totalStudents,
        totalClasses,
        totalExams,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const Student = require('../models/Student');
    const Class = require('../models/Class');
    const Exam = require('../models/Exam');
    const Result = require('../models/Result');

    // 1. Department Distribution (Student count per branch)
    const branchStats = await Student.aggregate([
      { $match: { organizationId: new require('mongoose').Types.ObjectId(req.organizationId) } },
      { $group: { _id: "$branch", count: { $sum: 1 } } }
    ]);

    // 2. Exam Status Distribution
    const examStats = await Exam.aggregate([
      { $match: { organizationId: new require('mongoose').Types.ObjectId(req.organizationId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // 3. Performance Aggregates (Pass vs Fail)
    const gradeStats = await Result.aggregate([
      { 
        $lookup: {
          from: 'exams',
          localField: 'examId',
          foreignField: '_id',
          as: 'exam'
        }
      },
      { $unwind: "$exam" },
      { $match: { "exam.organizationId": new require('mongoose').Types.ObjectId(req.organizationId) } },
      { $group: { _id: "$grade", count: { $sum: 1 } } }
    ]);
    
    // 4. Participation Stats (Active vs Separated)
    const participationStats = await Student.aggregate([
      { $match: { organizationId: new require('mongoose').Types.ObjectId(req.organizationId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // 5. Subject-wise Performance (Average score per exam)
    const subjectPerformance = await Result.aggregate([
      {
        $lookup: {
          from: 'exams',
          localField: 'examId',
          foreignField: '_id',
          as: 'exam'
        }
      },
      { $unwind: "$exam" },
      { $match: { "exam.organizationId": new require('mongoose').Types.ObjectId(req.organizationId) } },
      { 
        $group: { 
          _id: "$exam.title", 
          avgScore: { $avg: "$score" } 
        } 
      },
      { $sort: { avgScore: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        branchStats,
        examStats,
        gradeStats,
        participationStats,
        subjectPerformance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
