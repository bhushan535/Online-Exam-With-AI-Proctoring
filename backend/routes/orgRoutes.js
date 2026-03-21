const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Organization = require('../models/Organization');

// Shared route for anyone in the organization to see its structure
router.get('/details', authenticate, async (req, res) => {
  try {
    const orgId = req.organizationId;
    if (!orgId) return res.status(400).json({ success: false, message: 'Institutional link missing' });

    const organization = await Organization.findById(orgId);
    if (!organization) return res.status(404).json({ success: false, message: 'Registry not found' });

    res.json({ success: true, organization });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
