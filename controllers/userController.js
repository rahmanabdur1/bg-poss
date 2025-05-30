
const User = require('../models/newUser');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const emailConfig = {
  service: 'gmail',
  auth: {
    user:'rahmanabdurr65@gmail.com',
    pass:'sviu rehb oqut galk',
  },
};

const sendOTP = async (email, otp) => {
  const transporter = nodemailer.createTransport(emailConfig);
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP for Verification",
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
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
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

    if (!firstName || !lastName || !username || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    if (enableCustomAccess && userRole) {
      return res.status(400).json({ message: 'Cannot enable both custom access and assign a role' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email, username, or phone already exists' });
    }

    const userRoleValue = (!userRole || userRole === "null" || userRole === "") ? null : userRole;

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

    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        username: newUser.username,
        phone: newUser.phone,
        designation: newUser.designation,
        role: newUser.userRole,
        enableCustomAccess: newUser.enableCustomAccess,
        image: newUser.image,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(500).json({ message: 'Server error while creating user' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendOTP(email, otp);
    res.status(200).json({ message: "OTP sent to your email for verification." });
  } catch (error) {
    console.log("Error in login OTP step:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    setCookies(res, accessToken, refreshToken);
    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired or invalid." });
    }
    if (parseInt(user.otp) !== parseInt(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);
    setCookies(res, accessToken, refreshToken);
    res.json({
      message: "Login successful",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
