const express = require("express");
const router = express.Router();

// Import required for backward compatibility
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper function for token generation
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Legacy login route for backward compatibility
router.post('/teacher/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for legacy credentials
    if (email === 'teacher@123' && password === '123456') {
      // Find or create user
      let user = await User.findOne({ email: 'teacher@123' });

      if (!user) {
        // Auto-migrate on first login
        user = new User({
          email: 'teacher@123',
          password: '123456',
          role: 'teacher',
          name: 'Default Teacher',
          mode: 'solo'
        });
        await user.save();
      }

      const token = generateToken(user._id);

      return res.json({
        success: true,
        message: 'Login successful (legacy mode)',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mode: user.mode
        }
      });
    }

    // For non-legacy logins, return error
    res.status(401).json({
      success: false,
      message: 'Please use the new login system at /api/auth/login'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
