const mongoose = require('mongoose');
const User = require('./models/User');
const Organization = require('./models/Organization');
const TeacherProfile = require('./models/TeacherProfile');
const Class = require('./models/Class');
const Exam = require('./models/Exam');
require('dotenv').config();

async function runTests() {
  const baseUrl = 'http://127.0.0.1:5000/api';
  let principalToken = '';
  let principalId = '';
  let organizationId = '';
  let teacherToken = '';
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Cleanup
    await User.deleteMany({ email: { $in: ['principal@college.edu', 'sharma@college.edu'] } });
    await Organization.deleteMany({ name: 'ABC Engineering College' });
    
    console.log('--- TEST 1: Principal Signup ---');
    const signupRes = await fetch(`${baseUrl}/auth/signup/principal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Principal Kumar',
        email: 'principal@college.edu',
        password: 'principal123',
        orgName: 'ABC Engineering College',
        orgType: 'college',
        address: '123 Main Street'
      })
    });
    
    const signupData = await signupRes.json();
    console.log('Signup Status:', signupRes.status);
    if(signupRes.status !== 201) throw new Error('Principal Signup failed: ' + JSON.stringify(signupData));
    principalToken = signupData.token;
    
    const dbPrincipal = await User.findOne({ email: 'principal@college.edu' });
    const dbOrg = await Organization.findOne({ name: 'ABC Engineering College' });
    if(dbPrincipal && dbOrg && dbPrincipal.role === 'principal' && dbPrincipal.mode === 'organization' && dbPrincipal.organizationId.toString() === dbOrg._id.toString()) {
        console.log('✅ Principal User and Organization created correctly in DB');
        principalId = dbPrincipal._id;
        organizationId = dbOrg._id;
    } else {
        throw new Error('Principal or Org missing in DB');
    }
    
    console.log('\n--- TEST 2: Principal Adds Teacher ---');
    const addTeacherRes = await fetch(`${baseUrl}/principal/teacher/add`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${principalToken}`
      },
      body: JSON.stringify({
        name: 'Prof. Sharma',
        email: 'sharma@college.edu',
        password: 'sharma123',
        department: 'Computer Science',
        employeeId: 'EMP001'
      })
    });
    
    const addTeacherData = await addTeacherRes.json();
    console.log('Add Teacher Status:', addTeacherRes.status);
    if(addTeacherRes.status !== 201) throw new Error('Add teacher failed: ' + JSON.stringify(addTeacherData));
    
    const dbTeacher = await User.findOne({ email: 'sharma@college.edu' });
    const updatedOrg = await Organization.findById(organizationId);
    if(dbTeacher && dbTeacher.role === 'teacher' && dbTeacher.mode === 'organization' && dbTeacher.organizationId.toString() === organizationId.toString()) {
        const teacherInOrg = updatedOrg.teachers.find(t => t.userId.toString() === dbTeacher._id.toString());
        if(teacherInOrg && teacherInOrg.department === 'Computer Science' && teacherInOrg.employeeId === 'EMP001') {
             console.log('✅ Teacher created and added to Organization correctly');
        } else {
             throw new Error('Teacher metadata in Org incorrect');
        }
    } else {
        throw new Error('Teacher missing or incorrect in DB');
    }
    
    console.log('\n--- TEST 3: Teacher (Org Mode) Login ---');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'sharma@college.edu',
            password: 'sharma123'
        })
    });
    const loginData = await loginRes.json();
    console.log('Teacher Login Status:', loginRes.status);
    if(loginRes.status !== 200 || !loginData.token) throw new Error('Teacher login failed: ' + JSON.stringify(loginData));
    if(loginData.organization && loginData.organization.id === organizationId.toString() && loginData.organization.name === 'ABC Engineering College') {
        console.log('✅ Teacher logged in correctly and received Organization info');
        teacherToken = loginData.token;
    } else {
        throw new Error('Teacher login response missing org info');
    }
    
    console.log('\n--- TEST 4: Get Organization Stats ---');
    const statsRes = await fetch(`${baseUrl}/principal/stats`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${principalToken}`
        }
    });
    const statsData = await statsRes.json();
    console.log('Stats Status:', statsRes.status);
    if(statsRes.status !== 200) throw new Error('Failed to get stats');
    if(statsData.success && statsData.stats.totalTeachers === 1) {
        console.log('✅ Stats retrieved correctly:', statsData.stats);
    } else {
        throw new Error('Stats incorrect: ' + JSON.stringify(statsData));
    }
    
    console.log('\n🎉 ALL TESTS PASSED!');
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  } finally {
    // Cleanup
    await User.deleteMany({ email: { $in: ['principal@college.edu', 'sharma@college.edu'] } });
    await Organization.deleteMany({ name: 'ABC Engineering College' });
    if(principalId) {
        await TeacherProfile.deleteMany({ userId: principalId });
    }
    const teacher = await User.findOne({ email: 'sharma@college.edu' });
    if(teacher) {
        await TeacherProfile.deleteMany({ userId: teacher._id });
    }
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTests();
