const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Organization = require('../models/Organization');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/organization/me
// @desc    Get organization and principal data
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const organization = await Organization.findById(user.organizationId);
        if (!organization) return res.status(404).json({ message: 'Organization not found' });

        res.json({
            principalName: user.name,
            organizationName: organization.organizationName,
            institutionType: organization.institutionType,
            address: organization.address,
            permissions: organization.permissions,
            logo: organization.logo,
            branches: organization.branches || [],
            academicYears: organization.academicYears || [],
            semesters: organization.semesters || [],
            subjects: organization.subjects || []
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   PUT /api/organization/update
// @desc    Update organization and principal data
router.put('/update', authenticate, async (req, res) => {
    try {
        const { 
            principalName, organizationName, institutionType, address, permissions, logo,
            branches, academicYears, semesters, subjects 
        } = req.body;
        
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const organization = await Organization.findById(user.organizationId);
        if (!organization) return res.status(404).json({ message: 'Organization not found' });

        // Update User
        if (principalName) user.name = principalName;
        await user.save();

        // Update Organization
        if (organizationName) organization.organizationName = organizationName;
        if (institutionType) organization.institutionType = institutionType;
        if (address) organization.address = address;
        if (logo !== undefined) organization.logo = logo;
        
        if (branches) organization.branches = branches;
        if (academicYears) organization.academicYears = academicYears;
        if (semesters) organization.semesters = semesters;
        if (subjects) {
            organization.subjects = subjects;
            organization.markModified('subjects');
        }

        if (permissions) {
            organization.permissions = {
                ...organization.permissions,
                ...permissions
            };
        }
        
        await organization.save();

        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
