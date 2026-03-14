const mongoose = require('mongoose');
const User = require('./models/User');
const TeacherProfile = require('./models/TeacherProfile');
const Class = require('./models/Class');
require('dotenv').config();

async function runTests() {
  const baseUrl = 'http://127.0.0.1:5000/api';
  let token = '';
  
  try {
    // Connect to DB directly for varification
    await mongoose.connect(process.env.MONGO_URI);
    
    // Clean up before test
    await User.deleteMany({ email: 'test.teacher@example.com' });
    
    console.log('--- TEST 1: Solo Teacher Signup ---');
    const signupRes = await fetch(`${baseUrl}/auth/signup/teacher-solo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Teacher',
        email: 'test.teacher@example.com',
        password: 'password123',
        phone: '1234567890'
      })
    });
    
    const signupData = await signupRes.json();
    console.log('Signup Status:', signupRes.status);
    console.log('Signup Response:', JSON.stringify(signupData, null, 2));
    if (signupRes.status !== 201) throw new Error('Signup failed');
    console.log('✅ Signup API response verified');
    
    const dbUser = await User.findOne({ email: 'test.teacher@example.com' });
    const dbProfile = await TeacherProfile.findOne({ userId: dbUser._id });
    if (dbUser && dbProfile) {
      console.log('✅ Database entries verified (User + TeacherProfile)');
    } else {
      throw new Error('Database entries missing');
    }
    
    console.log('\n--- TEST 2: Solo Teacher Login ---');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test.teacher@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginRes.json();
    console.log('Login Status:', loginRes.status);
    if (loginRes.status !== 200 || !loginData.token) throw new Error('Login failed');
    token = loginData.token;
    console.log('✅ Login API response verified, token received');
    
    console.log('\n--- TEST 3: Legacy Teacher Login ---');
    const legacyRes = await fetch(`${baseUrl}/teacher/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teacher@123',
        password: '123456'
      })
    });
    
    const legacyData = await legacyRes.json();
    console.log('Legacy Login Status:', legacyRes.status);
    if (legacyRes.status !== 200 || !legacyData.token) throw new Error('Legacy login failed');
    console.log('✅ Legacy login successfully fallback to new backward-compatibility route.');
    
    console.log('\n--- TEST 4: Create Class as Solo Teacher ---');
    const classRes = await fetch(`${baseUrl}/classes`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        className: 'Test Subject',
        semester: '5th',
        branch: 'CSE',
        year: '3rd'
      })
    });
    
    const classData = await classRes.json();
    console.log('Create Class Status:', classRes.status);
    if (classRes.status !== 201) throw new Error('Class creation failed');
    
    const dbClass = await Class.findById(classData.class._id);
    if (dbClass.createdBy.toString() === dbUser._id.toString() 
        && dbClass.mode === 'solo' 
        && dbClass.organizationId === null) {
      console.log('✅ Class created securely with trackable createdBy, mode, and organizationId=null');
    } else {
      throw new Error('Class metadata is incorrect');
    }
    
    console.log('\n🎉 ALL TESTS PASSED!');
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  } finally {
    // Cleanup
    const user = await User.findOne({ email: 'test.teacher@example.com' });
    if(user) {
        await Class.deleteMany({ createdBy: user._id });
        await TeacherProfile.deleteMany({ userId: user._id });
        await User.deleteOne({ _id: user._id });
    }
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTests();
