const express = require("express");
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Class = require('../models/Class');
const Exam = require('../models/Exam');

// GET Teacher Stats (Solo Mode friendly)
router.get('/teacher/stats', authenticate, async (req, res) => {
  try {
    const classes = await Class.find({ createdBy: req.userId });
    
    let totalStudents = 0;
    classes.forEach(c => {
      totalStudents += c.students.length;
    });

    const totalExams = await Exam.countDocuments({ teacherId: req.userId });

    res.json({
      success: true,
      stats: {
        totalClasses: classes.length,
        totalStudents: totalStudents,
        totalExams: totalExams
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching stats" });
  }
});

module.exports = router;
