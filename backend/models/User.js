const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  resetRequestedAt: Date,
  resetRequestCount: {
    type: Number,
    default: 0,
  },
  lastResetRequestAt: Date,
  resetWindowStart: Date,
  passwordChangedAt: Date,
  password: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Run validation ONLY when password is being modified
        if (!this.isModified('password')) return true;
        // At least 6 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(v);
      },
      message: props => `Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.`
    }
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
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.index({ email: 1, role: 1, mode: 1 }, { unique: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
