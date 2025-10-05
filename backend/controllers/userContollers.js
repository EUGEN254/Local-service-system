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

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });
  

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: { 
      id: user._id, // Add this
      name: user.name, 
      email: user.email, 
      role: user.role 
    },
  });
};

export const loginUser = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Email, password, and role are required.",
    });
  }

  // 🔹 Find user by email and role
  const user = await User.findOne({ email, role }).select("name email password role").lean();

  if (!user) {
    // Check if email exists with another role
    const otherRoleUser = await User.findOne({ email });
    if (otherRoleUser) {
      return res.status(400).json({
        success: false,
        message: `This email is registered as a ${otherRoleUser.role}. Please log in as a ${otherRoleUser.role}.`,
      });
    }

    return res.status(400).json({
      success: false,
      message: "No account found with this email.",
    });
  }

  // 🔹 Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: "Incorrect password. Please try again.",
    });
  }

  const token = generateToken(user);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });

  const { password: _, ...userWithoutPassword } = user;

  return res.status(200).json({
    success: true,
    message: "Login successful!",
    user: userWithoutPassword,
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
