const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Rate limiter for forgot password to prevent IP-based brute forcing
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { 
    success: false, 
    message: 'Too many requests from this IP. Please try again after 15 minutes.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TeacherProfile = require('../models/TeacherProfile');
const Organization = require('../models/Organization');
const crypto = require('crypto');
const { sendResetEmail } = require('../utils/emailService');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Solo Teacher Signup
router.post('/signup/teacher-solo', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists (Hardened for Multi-mode support)
    const existingUser = await User.findOne({ email, role: 'teacher', mode: 'solo' });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered as a Solo Teacher',
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role: 'teacher',
      mode: 'solo',
    });
    await user.save();

    // Create teacher profile
    const teacherProfile = new TeacherProfile({
      userId: user._id,
      mode: 'solo',
      phone,
    });
    await teacherProfile.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Teacher registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mode: user.mode,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Principal Signup
router.post('/signup/principal', async (req, res) => {
  try {
    const {
      name, email, password,
      orgName, orgType, address,
    } = req.body;

    // Check if user exists (Hardened for Multi-mode support)
    let user = await User.findOne({ email, role: 'principal' });
    
    if (user && user.organizationId) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered as a Principal',
      });
    }

    // If user doesn't exist, create a new one
    if (!user) {
      user = new User({
        name,
        email,
        password,
        role: 'principal',
        mode: 'organization',
      });
    } else {
      // If user exists but organizationId is null, update password and name just in case
      user.name = name;
      user.password = password;
      user.mode = 'organization';
    }

    // Create organization instance
    const organization = new Organization({
      organizationName: orgName,
      institutionType: orgType,
      address,
      principalId: user._id,
    });

    // Link user to organization BEFORE validation/save
    user.organizationId = organization._id;

    // Validate both before saving anything
    await Promise.all([
      user.validate(),
      organization.validate()
    ]);

    // Save both
    await user.save();
    await organization.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mode: user.mode,
      },
      organization: {
        id: organization._id,
        name: organization.organizationName,
        type: organization.institutionType,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

const { authenticate } = require('../middleware/auth');

// Get current user info
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let additionalInfo = {};
    let studentExtras = {};

    if (user.role === 'teacher') {
      const profile = await TeacherProfile.findOne({ userId: user._id });
      additionalInfo.teacherProfile = profile;
    }

    // For students: look up enrollment, classId, branch, semester
    if (user.role === 'student') {
      const Student = require('../models/Student');
      const Class = require('../models/Class');
      const emailParts = user.email.split('@');
      const enrollment = emailParts[0].toUpperCase();

      const studentProfile = await Student.findOne({
        $or: [{ enrollmentNo: enrollment }, { userId: user._id }]
      });

      if (studentProfile) {
        studentExtras.enrollment = studentProfile.enrollmentNo;
        studentExtras.branch = studentProfile.branch;
        studentExtras.semester = studentProfile.currentSemester;
      }

      // Find classId from Class collection
      const classDoc = await Class.findOne({
        'students.enrollment': studentProfile?.enrollmentNo || enrollment
      });
      if (classDoc) studentExtras.classId = classDoc._id;
    }

    if (user.organizationId) {
      const org = await Organization.findById(user.organizationId);
      if (org) {
        additionalInfo.organization = {
          id: org._id,
          name: org.organizationName || org.name,
          type: org.institutionType || org.type,
          logo: org.logo,
          branches: org.branches,
          semesters: org.semesters,
          academicYears: org.academicYears,
          organizationName: org.organizationName
        };
      }
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mode: user.mode,
        ...studentExtras,
      },
      ...additionalInfo,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Unified Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, mode, role: requestedRole } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user with disambiguation (Hardened for multi-mode)
    let query = { email };
    if (mode) query.mode = mode;
    if (requestedRole) query.role = requestedRole;

    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Role verification (Strict Separation)
    const { role } = req.body;
    if (role && user.role !== role) {
      const portalName = role === 'principal' ? 'Organization Login' : 'Faculty Access';
      return res.status(401).json({
        success: false,
        message: `Role mismatch. This account is not authorized for the ${portalName} portal.`
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Get additional info based on role
    let additionalInfo = {};

    if (user.role === 'teacher') {
      const profile = await TeacherProfile.findOne({ userId: user._id });
      additionalInfo.teacherProfile = profile;
    }

    if (user.organizationId) {
      const org = await Organization.findById(user.organizationId);
      if (org) {
        additionalInfo.organization = {
          id: org._id,
          name: org.organizationName || org.name,
          type: org.institutionType || org.type,
          logo: org.logo,
          branches: org.branches,
          semesters: org.semesters,
          academicYears: org.academicYears,
          organizationName: org.organizationName
        };
      }
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mode: user.mode,
      },
      ...additionalInfo,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Forgot Password Request
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const startTime = Date.now();
  try {
    const { email, mode, role } = req.body;
    if (!email || !mode) {
      return res.status(400).json({ success: false, message: 'Email and mode are required' });
    }

    // Default role to teacher if not provided (safe-fallback for existing clients)
    const targetRole = role || 'teacher';
    
    console.log(`[FORGOT_PASSWORD] Query: email=${email.toLowerCase()}, role=${targetRole}, mode=${mode}`);

    // Find consistent user
    const user = await User.findOne({ 
      email: email.toLowerCase(), 
      mode, 
      role: targetRole 
    });
    
    if (!user) {
      console.log(`[FORGOT_PASSWORD] Result: User NOT found in DB search.`);
      // SECURITY: Timing Normalization even for non-existent users
      const waitTime = Math.max(0, 500 - (Date.now() - startTime));
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return res.json({ 
        success: true, 
        message: 'If an account exists with this email and mode, a reset link has been sent.' 
      });
    }

    const now = Date.now();
    const fifteenMins = 15 * 60 * 1000;

    // 1. Cooldown Check (60 seconds)
    if (user.lastResetRequestAt && now - new Date(user.lastResetRequestAt).getTime() < 60000) {
      return res.status(429).json({ 
        success: false, 
        message: `Please wait ${Math.ceil((60000 - (now - new Date(user.lastResetRequestAt).getTime())) / 1000)}s before resending.` 
      });
    }

    // 2. Fixed Window Reset Logic (15 minute window)
    if (!user.resetWindowStart || now - new Date(user.resetWindowStart).getTime() > fifteenMins) {
      user.resetWindowStart = new Date(now);
      user.resetRequestCount = 0;
    }

    // 3. Rate Limit Check (3 requests per window)
    if (user.resetRequestCount >= 3) {
      return res.status(429).json({ 
        success: false, 
        message: 'Too many password reset requests for this email. Please try again after 15 minutes.' 
      });
    }

    // Generate new token (Invalidates old ones)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = now + fifteenMins; // 15 mins expiry
    user.resetRequestedAt = new Date(now);
    user.lastResetRequestAt = new Date(now);
    user.resetRequestCount += 1;
    
    await user.save();

    // Send Email (Non-blocking to normalize response time)
    console.log(`[FORGOT_PASSWORD] Result: User found! Attempting to send email to ${user.email}...`);
    sendResetEmail(user.email, resetToken, mode, targetRole).catch(mailError => {
      console.error("Delayed Mail Error (Background):", mailError);
    });

    // Final response normalization delay
    const waitTime = Math.max(0, 500 - (Date.now() - startTime));
    await new Promise(resolve => setTimeout(resolve, waitTime));

    res.json({ 
      success: true, 
      message: 'If an account exists with this email and mode, a reset link has been sent.' 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reset Password Execution
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (!password) {
      return res.status(400).json({ success: false, message: 'New password is required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Update password and clear reset state
    user.password = password;
    user.plaintextPassword = undefined; // REMOVE legacy plaintext field
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.passwordChangedAt = new Date();
    
    // Clear rate limiting state on success
    user.resetRequestCount = 0;
    user.resetWindowStart = undefined;
    
    await user.save();

    res.json({ success: true, message: 'Password reset successful. You can now login with your new password.' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
