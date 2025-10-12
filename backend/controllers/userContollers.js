import User from "../models/userSchema.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import{v2 as cloudinary} from 'cloudinary'

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
  const user = await User.findOne({ email, role }).select("name email password role status").lean();

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

  // 🔹 Check if account is active
  if (user.status === "inactive") {
    return res.status(403).json({
      success: false,
      message: "Your account is inactive. Please contact the administrator.",
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

export const loginAdmin = async (req, res) => {
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
        message: `Invalid credentials`,
      });
    }

    return res.status(400).json({
      success: false,
      message: "No account found with this email.",
    });
  }

  // 🔹 Check if account is active
  if (user.status === "inactive") {
    return res.status(403).json({
      success: false,
      message: "Your account is inactive. Please contact the administrator.",
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

export const logoutAdmin = (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out successfully" });
};

// controllers/userController.js

export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Get fresh user data from database with serviceProviderInfo
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Return full safe user object (no password)
    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      address: user.address || "",
      bio: user.bio || "",
      image: user.image || "",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // ✅ Add verification status and rejection reason
      isVerified: user.serviceProviderInfo?.isVerified || false,
      verificationStatus: user.serviceProviderInfo?.idVerification?.status || "not-submitted",
      rejectionReason: user.serviceProviderInfo?.idVerification?.rejectionReason || "" // ✅ Add this
    };

    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Error in getMe:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// controllers/userControllers.js - Add this function
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long"
      });
    }

    // Find user by ID
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating password"
    });
  }
};



export const submitIdVerification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { phonenumber, idType, idNumber } = req.body;

    // Check if user is a service provider
    if (req.user.role !== 'service-provider') {
      return res.status(403).json({
        success: false,
        message: "Only service providers can submit ID verification"
      });
    }

    // Basic validation
    if (!phonenumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    // Check if files were uploaded
    if (!req.files || !req.files.frontImage || !req.files.backImage) {
      return res.status(400).json({
        success: false,
        message: "Both front and back ID images are required"
      });
    }

    const frontImageFile = req.files.frontImage[0];
    const backImageFile = req.files.backImage[0];

    // Validate file types
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedMimeTypes.includes(frontImageFile.mimetype) || !allowedMimeTypes.includes(backImageFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Only JPG, PNG, and PDF files are allowed"
      });
    }

    // Upload images to Cloudinary
    const [frontImageResult, backImageResult] = await Promise.all([
      cloudinary.uploader.upload(frontImageFile.path, { folder: "id-verification" }),
      cloudinary.uploader.upload(backImageFile.path, { folder: "id-verification" })
    ]);

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Initialize serviceProviderInfo if it doesn't exist
    if (!user.serviceProviderInfo) {
      user.serviceProviderInfo = {
        isVerified: false,
        rating: 0,
        totalReviews: 0,
        completedJobs: 0,
        services: [],
        idVerification: {
          status: "not-submitted"
        }
      };
    }

    // Update user data
    user.phone = phonenumber;
    user.serviceProviderInfo.idVerification = {
      status: "pending",
      submittedAt: new Date(),
      idFrontImage: frontImageResult.secure_url,
      idBackImage: backImageResult.secure_url,
      idType: idType || "national-id",
      idNumber: idNumber || "",
      cloudinaryFrontId: frontImageResult.public_id, // Store public_id for future management
      cloudinaryBackId: backImageResult.public_id    // Store public_id for future management
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "ID verification submitted successfully! Awaiting admin approval.",
      verificationStatus: "pending"
    });

  } catch (error) {
    console.error("Error submitting ID verification:", error);
    res.status(500).json({
      success: false,
      message: "Server error while submitting ID verification"
    });
  }
};

// Keep the getIdVerificationStatus function the same as before
export const getIdVerificationStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if user is a service provider
    if (req.user.role !== 'service-provider') {
      return res.status(403).json({
        success: false,
        message: "Only service providers can check verification status"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // If user doesn't have serviceProviderInfo, they haven't submitted anything
    if (!user.serviceProviderInfo || !user.serviceProviderInfo.idVerification) {
      return res.json({
        success: true,
        verificationStatus: "not-submitted",
        message: "No ID verification submitted yet"
      });
    }

    const verificationInfo = user.serviceProviderInfo.idVerification;

    res.json({
      success: true,
      verificationStatus: verificationInfo.status,
      submittedAt: verificationInfo.submittedAt,
      verifiedAt: verificationInfo.verifiedAt,
      idType: verificationInfo.idType,
      rejectionReason: verificationInfo.rejectionReason,
      // Optionally include image URLs if needed
      hasFrontImage: !!verificationInfo.idFrontImage,
      hasBackImage: !!verificationInfo.idBackImage
    });

  } catch (error) {
    console.error("Error getting verification status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching verification status"
    });
  }
};
