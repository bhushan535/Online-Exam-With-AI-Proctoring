const nodemailer = require('nodemailer');

const sendResetEmail = async (email, resetToken, mode, role) => {
  // Use environment variables for SMTP configuration
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const isPrincipal = role === 'principal';
  const roleName = isPrincipal ? 'Principal (Admin)' : 'Teacher';
  const modeName = mode === 'solo' ? 'Solo Mode' : 'Organization Mode';
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

  const mailOptions = {
    from: `"AI Proctoring System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Password Reset Request - ${modeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your <strong>${roleName}</strong> account in <strong>${modeName}</strong>.</p>
        <p>Please click the button below to reset your password. This link is valid for 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 10px;">Reset Password</a>
        <p style="margin-top: 20px; font-size: 12px; color: #777;">If you did not request this, please ignore this email.</p>
        <p style="font-size: 12px; color: #777;">Link: ${resetUrl}</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendResetEmail };
