import express from "express";
import { signupWithGoogle, loginWithGoogle } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signupWithGoogle);
router.post("/login", loginWithGoogle);

export default router;
