const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const { authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/notices
 * @desc    Create a new notice (Principals Only)
 * @access  Private (Principal)
 */
router.post('/notices', authenticate, async (req, res) => {
  try {
    if (req.userRole !== 'principal') {
      return res.status(403).json({ success: false, message: 'Only principals can create notices' });
    }

    const { title, content, targetRoles, priority, expiresAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const notice = new Notice({
      title,
      content,
      organizationId: req.organizationId,
      createdBy: req.userId,
      targetRoles: targetRoles || ['teacher', 'student'],
      priority: priority || 'medium',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    await notice.save();
    res.status(201).json({ success: true, notice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   GET /api/notices
 * @desc    Get all active notices for the user's organization and role
 * @access  Private
 */
router.get('/notices', authenticate, async (req, res) => {
  try {
    const query = {
      organizationId: req.organizationId,
      targetRoles: { $in: [req.userRole] },
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    };

    // Principals can see all notices they created (including teacher-only ones)
    if (req.userRole === 'principal') {
      delete query.targetRoles;
    }

    const notices = await Notice.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name');

    res.json({ success: true, notices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   DELETE /api/notices/:id
 * @desc    Delete a notice
 * @access  Private (Principal Only)
 */
router.delete('/notices/:id', authenticate, async (req, res) => {
  try {
    if (req.userRole !== 'principal') {
      return res.status(403).json({ success: false, message: 'Only principals can delete notices' });
    }

    const notice = await Notice.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
