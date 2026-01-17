import express from "express";
import {
  register,
  login,
  verifyOtp,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  registerAdmin,
  googleLogin,
  resendOtp
} from "../controllers/authController.js";

import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/admin/register", registerAdmin);
router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", authenticateUser, changePassword);
router.post("/google-login", googleLogin);
router.get("/profile", authenticateUser, getProfile);
router.get("/resendOtp", resendOtp);

export default router;
