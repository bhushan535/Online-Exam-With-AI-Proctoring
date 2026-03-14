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
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    req.userMode = user.mode;
    req.organizationId = user.organizationId;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token',
    });
  }
};

exports.isPrincipal = (req, res, next) => {
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
