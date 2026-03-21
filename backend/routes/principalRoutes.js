const express = require('express');
const router = express.Router();
const { authenticate, isPrincipal } = require('../middleware/auth');
const User = require('../models/User');
const TeacherProfile = require('../models/TeacherProfile');
const Organization = require('../models/Organization');

// 1. Organization Management (Read-only for Teachers, Full for Principals)
router.get('/organization', authenticate, async (req, res) => {
  try {
    if (req.userRole !== 'principal' && req.userRole !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const organization = await Organization.findById(req.organizationId);
    if (!organization) return res.status(404).json({ success: false, message: 'Registry not found' });
    res.json({ success: true, organization });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Teacher accessible POST/PUT routes
router.put('/teacher/curriculum', authenticate, async (req, res) => {
  try {
    if (req.userRole !== 'principal' && req.userRole !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const { branches, academicYears, semesters, subjects } = req.body;
    const organization = await Organization.findById(req.organizationId);
    if (!organization) return res.status(404).json({ success: false, message: "Organization record missing" });

    // Only allow updating curriculum fields
    if (branches) organization.branches = branches;
    if (academicYears) organization.academicYears = academicYears;
    if (semesters) organization.semesters = semesters;
    if (subjects) {
      organization.subjects = subjects;
      organization.markModified('subjects');
    }

    const savedOrg = await organization.save();
    res.json({ success: true, message: 'Curriculum updated successfully', organization: savedOrg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Consolidated authorization for principal-only routes
router.use(authenticate, (req, res, next) => {
    if (req.userRole === 'principal') {
        return next();
    }
    return res.status(403).json({ success: false, message: "Access denied. Principals only." });
});

// Organization update (Principal only)
router.put('/organization', async (req, res) => {
  try {
    const { 
        organizationName,
        institutionType,
        address, logo, settings, branches, academicYears, semesters, subjects 
    } = req.body;
    const organization = await Organization.findById(req.organizationId);
    if (!organization) return res.status(404).json({ success: false, message: "Organization record missing" });

    if (organizationName) organization.organizationName = organizationName;
    if (institutionType) organization.institutionType = institutionType;
    if (address) organization.address = address;
    if (logo !== undefined) organization.logo = logo;
    if (settings) organization.settings = settings;
    if (branches) organization.branches = branches;
    if (academicYears) organization.academicYears = academicYears;
    if (semesters) organization.semesters = semesters;
    if (subjects) {
      organization.subjects = subjects;
      organization.markModified('subjects');
    }

    const savedOrg = await organization.save();
    res.json({ success: true, message: 'Archive updated', organization: savedOrg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Faculty Management
router.post('/teacher/add', async (req, res) => {
  try {
    const { name, email, password, department, employeeId } = req.body;
    const organization = await Organization.findById(req.organizationId);
    if (!organization) return res.status(404).json({ success: false, message: 'Organization context lost' });

    // Hardened conflict check: Only block if email is already used in Organization Mode
    const existing = await User.findOne({ email, role: 'teacher', mode: 'organization' });
    if (existing) return res.status(400).json({ success: false, message: 'This email is already registered as an Organization teacher' });

    const teacherUser = new User({
      name, email, password,
      role: 'teacher', mode: 'organization',
      organizationId: organization._id,
    });
    await teacherUser.save();

    const teacherProfile = new TeacherProfile({
      userId: teacherUser._id,
      mode: 'organization',
      organizationId: organization._id,
      department, employeeId,
    });
    await teacherProfile.save();

    organization.teachers.push({ userId: teacherUser._id, department, employeeId });
    await organization.save();

    res.status(201).json({ success: true, message: 'Teacher onboarded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/teachers', async (req, res) => {
  try {
    const organization = await Organization.findById(req.organizationId).populate('teachers.userId', 'name email status');
    if (!organization) return res.status(404).json({ success: false, message: 'Registry not found' });
    res.json({ success: true, teachers: organization.teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/teacher/toggle-status/:teacherId', async (req, res) => {
  try {
    const user = await User.findById(req.params.teacherId);
    if (!user || user.organizationId?.toString() !== req.organizationId.toString()) {
      return res.status(404).json({ success: false, message: 'Account not found in your scope' });
    }
    user.status = user.status === 'active' ? 'suspended' : 'active';
    await user.save();
    res.json({ success: true, message: `Status updated to ${user.status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/teacher/reset-password/:teacherId', async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ success: false, message: "New password required" });

    const user = await User.findById(req.params.teacherId);
    if (!user || user.organizationId?.toString() !== req.organizationId.toString()) {
      return res.status(404).json({ success: false, message: 'Account not found in your scope' });
    }

    user.password = newPassword;
    user.plaintextPassword = ''; // Ensure it's cleared if it existed
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    console.log(`[DEBUG] Attempting purge of teacher ${teacherId} from Org ${req.organizationId}`);

    const organization = await Organization.findById(req.organizationId);
    if (!organization) return res.status(404).json({ success: false, message: 'Principal organization record not found' });

    const idx = organization.teachers.findIndex(t => t.userId && t.userId.toString() === teacherId);
    if (idx === -1) {
        console.warn(`[PURGE WARNING] Teacher ${teacherId} not indexed in Org ${req.organizationId}`);
        return res.status(404).json({ success: false, message: 'Teacher entry not found in organization registry' });
    }

    // Execution sequence
    organization.teachers.splice(idx, 1);
    await organization.save();
    
    await TeacherProfile.findOneAndDelete({ userId: teacherId });
    await User.findByIdAndDelete(teacherId);

    console.log(`[SUCCESS] Teacher ${teacherId} fully purged from system`);
    res.json({ success: true, message: 'Faculty record and profile purged successfully' });
  } catch (error) {
    console.error("[PURGE ERROR]:", error);
    res.status(500).json({ success: false, message: 'System error during purge protocol' });
  }
});

router.get('/students', async (req, res) => {
  try {
    const Student = require('../models/Student');
    const { search, branch, semester } = req.query;
    let filter = { organizationId: req.organizationId };
    if (branch) filter.branch = branch;
    if (semester) filter.currentSemester = semester.toString();
    
    let students = await Student.find(filter).populate('userId', 'name email').sort({ rollNo: 1 });
    
    if (search) {
      students = students.filter(s => 
        s.userId?.name.toLowerCase().includes(search.toLowerCase()) || 
        s.rollNo?.toString().toLowerCase().includes(search.toLowerCase())
      );
    }

    // Fetch stabilized metadata from Organization settings instead of dynamic calculation
    const organization = await Organization.findById(req.organizationId);

    res.json({ 
      success: true, 
      students,
      metadata: {
        branches: organization?.branches || [],
        semesters: (organization?.semesters || [])
          .map(sem => Number(sem))
          .filter(num => !isNaN(num))
          .sort((a, b) => a - b)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }

});

router.post('/promote-students', async (req, res) => {
  try {
    const { currentSemester, newSemester, branch, newYear } = req.body;
    const Student = require('../models/Student');
    const Class = require('../models/Class');
    const students = await Student.find({ organizationId: req.organizationId, currentSemester, branch, status: 'active' });
    
    if (students.length === 0) return res.status(404).json({ success: false, message: 'No eligible students for promotion' });

    for (let student of students) {
      const currentClasses = await Class.find({ organizationId: req.organizationId, semester: currentSemester, branch, status: 'active', 'students.enrollment': student.enrollmentNo });
      student.academicHistory.push({ year: student.currentYear, semester: student.currentSemester, classes: currentClasses.map(c => c._id), completedAt: new Date() });
      student.currentSemester = newSemester;
      if (newYear) student.currentYear = newYear;
      await student.save();
    }

    await Class.updateMany({ organizationId: req.organizationId, semester: currentSemester, branch, status: 'active' }, { $set: { status: 'completed' } });
    res.json({ success: true, message: `Successfully promoted ${students.length} students` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const organization = await Organization.findById(req.organizationId);
    if (!organization) return res.status(404).json({ success: false, message: 'Stats source unavailable' });
    
    const Class = require('../models/Class');
    const Exam = require('../models/Exam');
    const Student = require('../models/Student');
    
    res.json({ success: true, stats: { 
      totalTeachers: organization.teachers.length, 
      totalStudents: await Student.countDocuments({ organizationId: req.organizationId }), 
      totalClasses: await Class.countDocuments({ organizationId: req.organizationId }), 
      totalExams: await Exam.countDocuments({ organizationId: req.organizationId }) 
    }});
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const Student = require('../models/Student');
    const Exam = require('../models/Exam');
    const branchStats = await Student.aggregate([{ $match: { organizationId: new require('mongoose').Types.ObjectId(req.organizationId) } }, { $group: { _id: "$branch", count: { $sum: 1 } } }]);
    const examStats = await Exam.aggregate([{ $match: { organizationId: new require('mongoose').Types.ObjectId(req.organizationId) } }, { $group: { _id: "$status", count: { $sum: 1 } } }]);
    res.json({ success: true, data: { branchStats, examStats } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Data Sync Tools
router.post('/sync-teacher-stats', async (req, res) => {
    try {
        const Class = require('../models/Class');
        const Exam = require('../models/Exam');
        const organizationId = req.organizationId;

        // 1. Get all teachers in organization
        const profiles = await TeacherProfile.find({ organizationId });
        let profileCount = 0;
        let classesLinked = 0;
        let examsLinked = 0;

        for (let profile of profiles) {
            // Find all classes created by this user
            const classes = await Class.find({ createdBy: profile.userId, organizationId });
            profile.classesCreated = classes.map(c => c._id);
            classesLinked += classes.length;

            // Find all exams created by this user
            const exams = await Exam.find({ createdBy: profile.userId, organizationId });
            profile.examsCreated = exams.map(e => e._id);
            examsLinked += exams.length;

            await profile.save();
            profileCount++;
        }

        res.json({
            success: true,
            message: `Synchronization complete.`,
            stats: {
                profilesUpdated: profileCount,
                classesLinked,
                examsLinked
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/cleanup-students', async (req, res) => {
    try {
        const Student = require('../models/Student');
        const Class = require('../models/Class');
        const organizationId = req.organizationId;
        
        const students = await Student.find({ organizationId });
        let fixed = 0;
        let userCreated = 0;

        for (let student of students) {
            let changed = false;
            
            // 1. Fix User Linkage
            let user = await User.findById(student.userId);
            if (!user) {
                const syntheticEmail = `${student.enrollmentNo.toLowerCase()}@institution.com`;
                user = await User.findOne({ email: syntheticEmail });
                
                if (!user) {
                    user = new User({
                        name: "FixMe Student", 
                        email: syntheticEmail,
                        password: "ChangeMe@123", // Default secure-ish password
                        role: 'student',
                        mode: 'organization',
                        organizationId: organizationId
                    });
                    await user.save();
                    userCreated++;
                }
                student.userId = user._id;
                changed = true;
            }

            // 2. Fix Branch/Semester/RollNo from first available class record if empty
            if (!student.branch || !student.currentSemester || !student.rollNo) {
                const classRole = await Class.findOne({ 
                    organizationId, 
                    'students.enrollment': student.enrollmentNo 
                });
                if (classRole) {
                    if (!student.branch) student.branch = classRole.branch;
                    if (!student.currentSemester) student.currentSemester = classRole.semester;
                    
                    // Sync Roll No if exists in class record or global profile is missing it
                    const studentInClass = classRole.students.find(st => st.enrollment === student.enrollmentNo);
                    if (studentInClass && (!student.rollNo || student.rollNo === 0)) {
                        student.rollNo = studentInClass.rollNo;
                    }
                    
                    changed = true;
                }
            }

            if (changed) {
                await student.save();
                fixed++;
            }
        }

        res.json({ 
            success: true, 
            message: `Cleanup finalized. Profiles linked/fixed: ${fixed}, Missing users created: ${userCreated}` 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/student/:studentId', async (req, res) => {
    try {
        const Student = require('../models/Student');
        const Class = require('../models/Class');
        const student = await Student.findById(req.params.studentId);
        if (!student || student.organizationId.toString() !== req.organizationId.toString()) {
            return res.status(404).json({ success: false, message: 'Student not found in your database' });
        }

        // 1. Wipe from all classes
        await Class.updateMany(
            { organizationId: req.organizationId },
            { $pull: { students: { enrollment: student.enrollmentNo } } }
        );

        // 2. Delete Profile and User
        await Student.findByIdAndDelete(req.params.studentId);
        await User.findByIdAndDelete(student.userId);

        res.json({ success: true, message: 'Student and associated system records purged successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
