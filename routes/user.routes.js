import express from "express";
const router = express.Router();
import bcrypt from "bcryptjs";
import User from "../models/user.models.js";
import jwt from "jsonwebtoken";

/**
 * 🧩 REGISTER ROUTE
 * - Only one ADMIN can exist.
 * - Multiple USERs allowed.
 */
router.post("/register", async (req, res) => {
  try {
    const { username, name, email, password, role } = req.body;

    // 1️⃣ Basic validation
    if (!username || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled.",
      });
    }

    // 2️⃣ Check if user already exists (by email or username)
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email or username already exists.",
      });
    }

    // 3️⃣ Role restriction: Only one ADMIN allowed
    if (role === "ADMIN") {
      const existingAdmin = await User.findOne({ role: "ADMIN" });
      if (existingAdmin) {
        return res.status(403).json({
          success: false,
          message: "An ADMIN user already exists. Only one ADMIN is allowed.",
        });
      }
    }

    // 4️⃣ Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5️⃣ Create new user
    const newUser = new User({
      username,
      name,
      email,
      password: hashedPassword,
      role: role || "USER",
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
      user: {
        id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("❌ Error in /register:", error);
    res.status(500).json({
      success: false,
      message: `Internal Server Error. (${error.message})`,
    });
  }
});

/**
 * 🔐 LOGIN ROUTE
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // 2️⃣ Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials (email not found).",
      });
    }

    // 3️⃣ Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials (incorrect password).",
      });
    }

    // 4️⃣ Generate JWT Token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Error in /login:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again later.",
    });
  }
});

/**
 * 🚪 LOGOUT ROUTE
 */
router.post("/logout", async (req, res) => {
  try {
    // If token stored in cookies (for security)
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "User logged out successfully.",
    });
  } catch (error) {
    console.error("❌ Error in /logout:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again later.",
    });
  }
});

export default router;
