import { OAuth2Client } from "google-auth-library";
import User from "../models/user.js";
import jwt from "jsonwebtoken";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const createOrLoginUser = async (req, res) => {
  try {
    const { token, accessCode } = req.body;

    
    if (accessCode !== process.env.SECRET_ACCESS_CODE) {
      return res.status(403).json({ message: "Invalid access code" });
    }

    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const { email, name, sub } = ticket.getPayload();

    
    let user = await User.findOne({ email });

    
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId: sub
      });
    }

   
    const authToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token: authToken,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
