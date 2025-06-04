// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const {
  createUser,
  login,
  logout,
  refreshToken,
  verifyLoginOTP,
  requestPasswordReset,
  confirmPasswordReset
} = require("../controllers/userController");

router.post("/create_new", createUser);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.post("/verify-otp", verifyLoginOTP);
router.post("/reset-password/request", requestPasswordReset);
router.post("/reset-password/confirm", confirmPasswordReset);

module.exports = router;