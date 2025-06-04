// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const permissionSchema = new mongoose.Schema({
  module: String,
  subModule: String,
  authorized: {
    create: Boolean,
    view: Boolean,
    edit: Boolean,
    delete: Boolean
  },
  status: {
    create: Boolean,
    view: Boolean,
    edit: Boolean,
    delete: Boolean
  },
  ownData: {
    create: Boolean,
    view: Boolean,
    edit: Boolean,
    delete: Boolean
  },
  otherUserData: {
    create: Boolean,
    view: Boolean,
    edit: Boolean,
    delete: Boolean
  }
});

const userSchema = new mongoose.Schema({
  image: { type: String, default: '' },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  designation: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  userRole: { type: mongoose.Schema.Types.ObjectId, ref: 'UserRole', default: null },
  enableCustomAccess: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  otp: Number,
  otpExpiry: Date,
  customPermissions: {
    type: [permissionSchema],
    default: []
  }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);