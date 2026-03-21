require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('--- Email Debugging Script ---');
  console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '******** (Hidden)' : 'MISSING');

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    debug: true, // Enable debug output
    logger: true, // Log information to console
  });

  try {
    console.log('\nTesting connection...');
    await transporter.verify();
    console.log('SUCCESS: Connection verified!');

    console.log('\nSending test email...');
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self
      subject: 'Nodemailer Test',
      text: 'This is a test email from the debugging script.',
    });
    console.log('SUCCESS: Test email sent!');
  } catch (error) {
    console.error('\nFAILED:', error);
    if (error.code === 'EAUTH') {
      console.log('\nADVICE: This is an authentication error. Possible causes:');
      console.log('1. The App Password in .env is incorrect or has been revoked.');
      console.log('2. The EMAIL_USER does not match the account that generated the password.');
      console.log('3. 2FA is not enabled or App Passwords are not configured for this account.');
      console.log('4. Google is blocking the sign-in attempt (check your inbox for a security alert).');
    }
  }
}

testEmail();
