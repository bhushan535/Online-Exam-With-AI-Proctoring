const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const { authenticate, isPrincipal } = require('../middleware/auth');

// @route   GET /api/org/settings
// @desc    Get organization settings
router.get('/settings', authenticate, isPrincipal, async (req, res) => {
    try {
        const org = await Organization.findById(req.organizationId);
        if (!org) {
            return res.json({
                organizationName: '',
                institutionType: 'School',
                address: '',
                logo: '',
                branches: [],
                academicYears: [],
                semesters: [],
                subjects: [],
                permissions: {
                    allowTeacherStudentImport: false,
                    principalApprovalLoop: false,
                    internalExamSharing: false
                }
            });
        }
        res.json(org);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   PUT /api/org/settings
// @desc    Update organization settings (Handles Base64 logo in body)
router.put('/settings', authenticate, isPrincipal, async (req, res) => {
    try {
        const fields = [
            'organizationName', 'institutionType', 'address', 
            'branches', 'academicYears', 'semesters', 'subjects', 'logo'
        ];
        
        const updateData = {};
        
        // Add top-level fields if they exist
        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Validation only if organizationName is being updated
        if (updateData.organizationName !== undefined && updateData.organizationName.length < 2) {
            return res.status(400).json({ message: 'Organization name must be at least 2 chars' });
        }

        // Handle nested permissions with dot notation for deep merge
        if (req.body.permissions) {
            Object.keys(req.body.permissions).forEach(key => {
                updateData[`permissions.${key}`] = req.body.permissions[key];
            });
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No fields provided for update' });
        }

        const updatedOrg = await Organization.findOneAndUpdate(
            { _id: req.organizationId },
            { $set: updateData },
            { upsert: true, new: true, runValidators: true }
        );

        res.json(updatedOrg);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
