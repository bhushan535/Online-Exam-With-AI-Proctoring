const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`[AUTH DEBUG] Token Decoded - UserId: ${decoded.userId}`);
    const user = await User.findById(decoded.userId);

    if (!user) {
      console.log(`[AUTH DEBUG] User not found for ID: ${decoded.userId}`);
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log(`[AUTH DEBUG] User Found - ID: ${user._id}, Role: ${user.role}`);
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact your administrator.',
      });
    }

    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    req.userMode = user.mode;
    req.organizationId = user.organizationId;

    if (user.role === 'teacher') {
        const TeacherProfile = require('../models/TeacherProfile');
        req.teacherProfile = await TeacherProfile.findOne({ userId: user._id });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token',
    });
  }
};

exports.isPrincipal = (req, res, next) => {
  console.log(`[AUTH DEBUG] Principal Check - UserID: ${req.userId}, Role: ${req.userRole}`);
  if (req.userRole !== 'principal') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Principals only.',
    });
  }
  next();
};

exports.isTeacher = (req, res, next) => {
  if (req.userRole !== 'teacher') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Teachers only.',
    });
  }
  next();
};

exports.isStudent = (req, res, next) => {
  if (req.userRole !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Students only.',
    });
  }
  next();
};

exports.isOrganizationMode = (req, res, next) => {
  if (req.userMode !== 'organization') {
    return res.status(403).json({
      success: false,
      message: 'This feature requires organization mode',
    });
  }
  next();
};
