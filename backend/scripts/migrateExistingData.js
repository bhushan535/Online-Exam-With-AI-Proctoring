const mongoose = require('mongoose');
const User = require('../models/User');
const TeacherProfile = require('../models/TeacherProfile');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
require('dotenv').config();

async function migrate() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Check if default teacher exists
    const existingTeacher = await User.findOne({ email: 'teacher@123' });

    if (!existingTeacher) {
      console.log('Creating default teacher user...');

      // Create user for existing teacher
      const teacherUser = new User({
        email: 'teacher@123',
        password: '123456',
        role: 'teacher',
        name: 'Default Teacher',
        mode: 'solo',
      });
      await teacherUser.save();
      console.log('✅ Default teacher user created');

      // Create teacher profile
      const teacherProfile = new TeacherProfile({
        userId: teacherUser._id,
        mode: 'solo',
      });
      await teacherProfile.save();
      console.log('✅ Teacher profile created');

      // Update all existing classes
      const classesUpdated = await Class.updateMany(
        { createdBy: { $exists: false } },
        {
          $set: {
            createdBy: teacherUser._id,
            mode: 'solo',
          },
        }
      );
      console.log(`✅ Updated ${classesUpdated.modifiedCount} classes`);

      // Update all existing exams
      const examsUpdated = await Exam.updateMany(
        { createdBy: { $exists: false } },
        {
          $set: {
            createdBy: teacherUser._id,
            visibility: 'private',
          },
        }
      );
      console.log(`✅ Updated ${examsUpdated.modifiedCount} exams`);

      console.log('✅ Migration completed successfully');
    } else {
      console.log('Default teacher already exists. Migration skipped.');
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run migration
migrate();
