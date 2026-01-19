import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";

import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { sendEmail } from "../utils/mailer.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate & send OTP
const generateAndSendOtp = async (email, subject) => {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.findOneAndUpdate(
    { email },
    { code: otpCode, expiresAt: Date.now() + 10 * 60 * 1000 },
    { upsert: true }
  );

  await sendEmail({
    to: email,
    subject,
    html: `<p>Your OTP is <b>${otpCode}</b></p>`
  });
};

//AUTH CONTROLLERS 

// Register new user
export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, phone, password: hashedPassword });

    await generateAndSendOtp(email, "Verify Your Email");

    res.status(201).json({ message: "OTP sent to email" });
  } catch {
    res.status(500).json({ error: "Registration failed" });
  }
};

// Admin Register new registration
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, secretCode } = req.body;

    if (secretCode !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: "Invalid admin secret" });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "admin",
    });

    await generateAndSendOtp(email, "Verify Admin Email");

    res.status(201).json({ message: "Admin registered. OTP sent." });
  } catch {
    res.status(500).json({ error: "Admin registration failed" });
  }
};

// Verify OTP for new sending and registration
export const verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    const otp = await Otp.findOne({ email, code });

    if (!otp || otp.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await User.findOneAndUpdate({ email }, { isVerified: true });
    await Otp.deleteOne({ _id: otp._id });

    res.json({ message: "Email verified" });
  } catch {
    res.status(500).json({ error: "OTP verification failed" });
  }
};

// Resend OTP option for resending otps
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) {
      return res.status(400).json({ message: "Already verified" });
    }

    await generateAndSendOtp(email, "Resend OTP");

    res.json({ message: "OTP resent" });
  } catch {
    res.status(500).json({ error: "Failed to resend OTP" });
  }
};

// Login with email and password 
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Verify email first" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
};

// Forgot Password to change password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!(await User.findOne({ email }))) {
      return res.status(404).json({ message: "User not found" });
    }

    await generateAndSendOtp(email, "Password Reset OTP");
    res.json({ message: "OTP sent" });
  } catch {
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

// Reset Password in need of changing password
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const otp = await Otp.findOne({ email, code });

    if (!otp || otp.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    await Otp.deleteOne({ _id: otp._id });

    res.json({ message: "Password reset successful" });
  } catch {
    res.status(500).json({ error: "Reset failed" });
  }
};

// Change Password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed" });
  } catch {
    res.status(500).json({ error: "Change failed" });
  }
};

// Google Login
export const googleLogin = async (req, res) => {
  try {
    const { tokenId } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name } = ticket.getPayload();

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        isVerified: true,
        password: "",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch {
    res.status(500).json({ error: "Google login failed" });
  }
};

// Profile fetch Uer details
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};
