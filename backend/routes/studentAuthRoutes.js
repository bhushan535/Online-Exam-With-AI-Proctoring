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
    const { enrollment, password } = req.body;

    if (!enrollment || !password) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    // 1. Check for Organization Student (User Model)
    const institutionalEmail = `${enrollment.toLowerCase()}@institution.com`;
    let user = await User.findOne({ email: institutionalEmail });
    
    // If not found by email, check legacy Class model (Solo Mode)
    let cls = null;
    let legacyStudent = null;

    if (!user) {
      cls = await Class.findOne({ "students.enrollment": enrollment });
      if (cls) {
        legacyStudent = cls.students.find(s => s.enrollment === enrollment && s.password === password);
      }
    } else {
      // User account exists, check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
         return res.status(401).json({ success: false, message: "Invalid enrollment or password" });
      }
    }

    if (!user && !legacyStudent) {
      return res.status(401).json({ success: false, message: "Invalid enrollment or password" });
    }

    // 2. Prepare User Object & Token
    let userData = null;
    let organizationData = null;
    let token = null;

    if (user) {
      token = generateToken(user._id);
      userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mode: user.mode,
        enrollment // Pass enrollment for frontend state
      };
      
      if (user.organizationId) {
        const org = await Organization.findById(user.organizationId);
        if (org) {
          organizationData = {
            id: org._id,
            name: org.name,
            type: org.type,
            logo: org.logo
          };
        }
      }
    } else {
      // Legacy Solo mode login (No User account yet, but valid class student)
      // Note: In a real production app, we'd create a User account here if we want JWT.
      // For now, let's treat enrollment as ID for token generation if needed, 
      // or return a simpler result. But AuthContext NEEDS a token.
      
      return res.status(403).json({ 
        success: false, 
        message: "Legacy login detected. Please use regular teacher login or contact admin to migrate." 
      });
      // Actually, for "proper" integration, I should probably generate a token for solo students too.
    }

    res.json({
      success: true,
      token,
      user: userData,
      organization: organizationData
    });

  } catch (err) {
    console.error("STUDENT LOGIN ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router; // 🔥 THIS LINE IS MANDATORY
