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
        select: 'name email',
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

module.exports = router;
