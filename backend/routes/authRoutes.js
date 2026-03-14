const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TeacherProfile = require('../models/TeacherProfile');
const Organization = require('../models/Organization');

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

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
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

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role: 'principal',
      mode: 'organization',
    });
    await user.save();

    // Create organization
    const organization = new Organization({
      name: orgName,
      type: orgType,
      address,
      principalId: user._id,
    });
    await organization.save();

    // Link user to organization
    user.organizationId = organization._id;
    await user.save();

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
        name: organization.name,
        type: organization.type,
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
    if (user.role === 'teacher') {
      const profile = await TeacherProfile.findOne({ userId: user._id });
      additionalInfo.teacherProfile = profile;
    }

    if (user.organizationId) {
      const org = await Organization.findById(user.organizationId);
      if (org) {
        additionalInfo.organization = {
          id: org._id,
          name: org.name,
          type: org.type,
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
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
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
          name: org.name,
          type: org.type,
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

module.exports = router;
