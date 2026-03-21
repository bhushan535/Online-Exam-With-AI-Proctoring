const express = require("express");
const router = express.Router();
const Class = require("../models/Class");
const Student = require("../models/Student");
const { authenticate } = require("../middleware/auth");

// GET STUDENT PROFILE (for history)
router.get("/student/profile", authenticate, async (req, res) => {
  try {
    // 1. Extract enrollment from email (e.g. "12345@institution.com" -> "12345")
    const emailParts = req.user.email.split('@');
    const enrollment = emailParts[0].toUpperCase();

    // 2. Find student profile
    const student = await Student.findOne({ 
      $or: [
        { enrollmentNo: enrollment },
        { userId: req.userId }
      ]
    });

    if (!student) {
      return res.json({ success: true, student: { academicHistory: [] } });
    }

    // 3. Optional: Populate class names in history if needed
    // For now, returning as is.

    res.json({
      success: true,
      student
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const jwt = require("jsonwebtoken");
const Organization = require("../models/Organization");
const User = require("../models/User");

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// STUDENT LOGIN
router.post("/student/login", async (req, res) => {
  try {
    const enrollmentInput = req.body.enrollment?.toString().trim().toUpperCase();
    const { password } = req.body;

    if (!enrollmentInput || !password) {
      return res.status(400).json({ success: false, message: "Enrollment and password are required" });
    }

    // 1. Find Student Profile by enrollment
    const studentProfile = await Student.findOne({ enrollmentNo: enrollmentInput }).populate('userId');
    
    if (!studentProfile || !studentProfile.userId) {
      // Fallback: Check if user exists by institutional email directly (in case profile is missing but user exists)
      const institutionalEmail = `${enrollmentInput.toLowerCase()}@institution.com`;
      const user = await User.findOne({ email: institutionalEmail });
      
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid enrollment or password" });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
         return res.status(401).json({ success: false, message: "Invalid enrollment or password" });
      }

      // Look up classId
      let classId = null;
      const classDoc = await Class.findOne({ 'students.enrollment': enrollmentInput });
      if (classDoc) classId = classDoc._id;

      const token = generateToken(user._id);
      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mode: user.mode,
          enrollment: enrollmentInput,
          classId: classId
        }
      });
    }

    // 2. Core Login Logic (Profile exists)
    const user = studentProfile.userId;
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid enrollment or password" });
    }

    // 3. Prepare Response
    const token = generateToken(user._id);
    let organizationData = null;

    // Look up classId from Class collection
    let classId = null;
    const classDoc = await Class.findOne({ 'students.enrollment': studentProfile.enrollmentNo });
    if (classDoc) classId = classDoc._id;

    if (user.organizationId) {
      const org = await Organization.findById(user.organizationId);
      if (org) {
        organizationData = {
          id: org._id,
          name: org.organizationName || org.name,
          type: org.institutionType || org.type,
          logo: org.logo
        };
      }
    }

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mode: user.mode,
        enrollment: studentProfile.enrollmentNo,
        branch: studentProfile.branch,
        semester: studentProfile.currentSemester,
        classId: classId
      },
      organization: organizationData
    });

  } catch (err) {
    console.error("STUDENT LOGIN ERROR:", err);
    res.status(500).json({ success: false, message: "Server authentication error" });
  }
});

// ALIAS FOR CLASS-SPECIFIC LOGIN (Compatibility)
router.post("/student/class-login", async (req, res) => {
    // Redirect to main login but maintain backward compatibility if needed
    try {
        const { enrollment, password } = req.body;
        // Same logic as /student/login
        const studentProfile = await Student.findOne({ enrollmentNo: enrollment.toUpperCase() }).populate('userId');
        
        if (!studentProfile || !studentProfile.userId) {
            return res.status(401).json({ success: false, message: "Invalid enrollment or password" });
        }

        const user = studentProfile.userId;
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid enrollment or password" });
        }

        const token = generateToken(user._id);
        res.json({
            success: true,
            token,
            student: { // Note: StudentClassLogin.js expects 'student' property
                ...user.toObject(),
                id: user._id,
                enrollment: studentProfile.enrollmentNo
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router; // 🔥 THIS LINE IS MANDATORY
