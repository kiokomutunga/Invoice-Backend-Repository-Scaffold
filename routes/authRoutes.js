const router = require("express").Router();
const {
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
} = require("../controllers/authController");

const { authenticateUser } = require("../middleware/auth");
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




module.exports = router;
