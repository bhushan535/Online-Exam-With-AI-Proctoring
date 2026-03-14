const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['principal', 'teacher', 'student'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    enum: ['solo', 'organization'],
    default: 'solo',
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
