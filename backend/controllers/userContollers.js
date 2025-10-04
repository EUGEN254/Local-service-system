import User from "../models/userSchema.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res
      .status(400)
      .json({ success: false, message: "Email already exists" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  // Generate JWT token with role
  const token = generateToken(user);

  // Set HttpOnly cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Respond with user info
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: { name: user.name, email: user.email, role: user.role },
  });
};

export const loginUser = async (req, res) => {
  const { email, password, role } = req.body; 

  if (!email || !password || !role) {
    return res
      .status(400)
      .json({ success: false, message: "Email, password and role required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid credentials" });
  }

  // Check if the selected role matches the user's role
  if (user.role !== role) {
    return res
      .status(400)
      .json({ success: false, message: `No ${role} account found with this email` });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid credentials" });
  }

  const token = generateToken(user);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: "Login successful",
    user: { name: user.name, email: user.email, role: user.role },
  });
};


export const logoutUser = (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out successfully" });
};

export const getMe = async (req, res) => {
  // `req.user` is set by `authMiddleware` after JWT verification
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  res.json({
    success: true,
    user: {
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};
