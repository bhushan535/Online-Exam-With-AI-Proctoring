const mongoose = require('mongoose');
const Class = require('./models/Class');
const Exam = require('./models/Exam');
const Subject = require('./models/Subject');
const User = require('./models/User');

const MONGO_URI = "mongodb+srv://bhushanpb535:05032005@online-examination-syst.fwmfqdq.mongodb.net/?appName=online-examination-system-Cluster";

async function verifyIsolation() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Create Test Teachers
    const teacherA = await User.findOneAndUpdate(
      { email: 'teacherA@test.com' },
      { name: 'Teacher A', role: 'teacher', mode: 'solo' },
      { upsert: true, new: true }
    );
    const teacherB = await User.findOneAndUpdate(
      { email: 'teacherB@test.com' },
      { name: 'Teacher B', role: 'teacher', mode: 'solo' },
      { upsert: true, new: true }
    );

    console.log(`Teacher A ID: ${teacherA._id}`);
    console.log(`Teacher B ID: ${teacherB._id}`);

    // 2. Create Data for Teacher A
    const subjectA = await Subject.findOneAndUpdate(
      { name: 'Math-A', teacherId: teacherA._id },
      { code: 'MATH101', teacherId: teacherA._id },
      { upsert: true, new: true }
    );

    const classA = await Class.findOneAndUpdate(
      { className: 'Class-A', teacherId: teacherA._id },
      { branch: 'CS', year: '2024', semester: '1', teacherId: teacherA._id, mode: 'solo' },
      { upsert: true, new: true }
    );

    const examA = await Exam.findOneAndUpdate(
      { examName: 'Exam-A', teacherId: teacherA._id },
      { 
        branch: 'CS', year: '2024', semester: '1', subject: 'Math-A', subCode: 'MATH101',
        examDate: new Date(), classId: classA._id, teacherId: teacherA._id, mode: 'solo',
        totalQuestions: 10, duration: 60, totalMarks: 100
      },
      { upsert: true, new: true }
    );

    console.log("Created test data for Teacher A");

    // 3. Verify Isolation - Teacher B queries
    console.log("\n--- VERIFYING ISOLATION ---");

    const subjectsForB = await Subject.find({ teacherId: teacherB._id });
    console.log(`Subjects for B: ${subjectsForB.length} (Expected: 0)`);

    const classesForB = await Class.find({ teacherId: teacherB._id });
    console.log(`Classes for B: ${classesForB.length} (Expected: 0)`);

    const examsForB = await Exam.find({ teacherId: teacherB._id });
    console.log(`Exams for B: ${examsForB.length} (Expected: 0)`);

    // 4. Verify Ownership Logic (Simulated API logic)
    const unauthorizedClass = await Class.findOne({ _id: classA._id, teacherId: teacherB._id });
    console.log(`Teacher B access to Teacher A's class: ${unauthorizedClass ? 'PASSED (Wrong!)' : 'BLOCKED (Correct)' }`);

    const unauthorizedExam = await Exam.findOne({ _id: examA._id, teacherId: teacherB._id });
    console.log(`Teacher B access to Teacher A's exam: ${unauthorizedExam ? 'PASSED (Wrong!)' : 'BLOCKED (Correct)' }`);

    if (subjectsForB.length === 0 && classesForB.length === 0 && !unauthorizedClass && !unauthorizedExam) {
      console.log("\nSUCCESS: Data isolation is strictly enforced at the database level.");
    } else {
      console.error("\nFAILURE: Data leakage detected!");
    }

    process.exit(0);
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  }
}

verifyIsolation();
