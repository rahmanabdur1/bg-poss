const User = require('../models/newUser');
 const UserRole = require('../models/UserRole'); 
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

const emailConfig = {
  service: 'gmail',
  auth: {
    user: 'rahmanabdurr65@gmail.com',
    pass: 'sviu rehb oqut galk',
  },
};

const transporter = nodemailer.createTransport(emailConfig);

const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: emailConfig.auth.user,
    to: email,
    subject: 'Your OTP for Verification',
    html: `<p>Your OTP is: <b>${otp}</b></p>`,
  };
  await transporter.sendMail(mailOptions);
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

exports.createUser = async (req, res) => {
  try {
    const {
      image,
      firstName,
      lastName,
      designation,
      username,
      email,
      phone,
      password,
      confirmPassword,
      userRole,
      enableCustomAccess,
      customPermissions
    } = req.body;

    if (!firstName || !lastName || !username || !email || !phone || !password || !confirmPassword)
      return res.status(400).json({ message: 'All required fields must be filled' });

    if (password !== confirmPassword)
      return res.status(400).json({ message: 'Passwords do not match' });

    if (enableCustomAccess && userRole)
      return res.status(400).json({ message: 'Cannot use both custom access and role' });

    const existingUser = await User.findOne({ $or: [{ email }, { username }, { phone }] });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    let userRoleValue = null;
    if (userRole && userRole !== 'null' && userRole !== '') {
      const role = await UserRole.findById(userRole);
      if (!role) return res.status(400).json({ message: 'Invalid user role' });
      userRoleValue = role._id;
    }

    const newUser = new User({
      image,
      firstName,
      lastName,
      designation,
      username,
      email,
      phone,
      password,
      userRole: userRoleValue,
      enableCustomAccess,
      customPermissions: enableCustomAccess ? customPermissions : [],
    });

    await newUser.save();

    const { accessToken, refreshToken } = generateTokens(newUser._id);
    setCookies(res, accessToken, refreshToken);

    res.status(201).json({ message: 'User created', user: newUser });
  } catch (error) {
    console.error('Create user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendOTP(email, otp);
    res.status(200).json({ message: 'OTP sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


exports.verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    console.log(user,'user')

    if (!user || user.otp !== parseInt(otp) || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.otp = undefined;
    user.otpExpiry = undefined;
    user.isVerified = true;

    await user.save();

    const updatedUser = await User.findById(user._id); // ✅ Re-fetch from DB to confirm
    console.log('Updated user isVerified:', updatedUser.isVerified); // Should be true

    const { accessToken, refreshToken } = generateTokens(user._id);
    setCookies(res, accessToken, refreshToken);

    res.json({ message: 'Login successful', user: updatedUser }); // Return updated user
  } catch (error) {
    console.error('verifyLoginOTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



exports.logout = (req, res) => {
  try {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.refreshToken = (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: 'Token missing' });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });

    setCookies(res, accessToken, refreshToken);
    res.json({ message: 'Token refreshed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendOTP(email, otp);
    res.json({ message: 'OTP sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.confirmPasswordReset = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    if (!email || !otp || !newPassword || !confirmPassword)
      return res.status(400).json({ message: 'All fields are required' });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: 'Passwords do not match' });

    const user = await User.findOne({ email });
    if (!user || user.otp !== parseInt(otp) || user.otpExpiry < Date.now())
      return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};