import User from "../models/userSchema.js";
import { generateTokenOld as generateToken } from "../utils/index.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import { createNotification } from "./notificationController.js";
import PasswordReset from "../models/passwordReset.js";
import { sendOtpEmail } from "../utils/index.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function for role-specific welcome messages
const getRoleSpecificMessage = (role) => {
  switch (role) {
    case "customer":
      return "Start exploring services in your area and book your first service today!";
    case "service-provider":
      return "Complete your profile and get verified to start accepting service requests.";
    case "admin":
      return "You have access to the admin dashboard to manage the platform.";
    default:
      return "Start using our platform to find or provide services.";
  }
};

// Helper: Map user roles to notification categories
const getNotificationCategory = (userRole) => {
  const categoryMap = {
    customer: "User",
    "service-provider": "Service Provider",
    admin: "System",
  };
  return categoryMap[userRole] || "System";
};

// Register new user
export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  // Check for existing email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "Email already exists",
    });
  }

  // Hash password and create user
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  // Send welcome notification
  await createNotification(user._id, {
    title: "Welcome to Local Services System! 🎉",
    message: `Welcome ${name}! Your ${role} account has been created successfully. ${getRoleSpecificMessage(
      role,
    )}`,
    type: "system",
    category: getNotificationCategory(role),
    priority: "high",
  });

  // Notify all admins about new registration
  const adminUsers = await User.find({ role: "admin" });
  for (const admin of adminUsers) {
    await createNotification(admin._id, {
      title: "New User Registration",
      message: `New ${role} registered: ${name} (${email})`,
      type: "user",
      category: "User",
      priority: "medium",
    });
  }

  // Special handling for service providers
  if (role === "service-provider") {
    await createNotification(user._id, {
      title: "Service Provider Account Created",
      message:
        "Your service provider account is pending verification. Please submit your ID documents to start accepting bookings.",
      type: "verification",
      category: "Verification",
      priority: "high",
    });

    // Notify admins about new service provider
    for (const admin of adminUsers) {
      await createNotification(admin._id, {
        title: "New Service Provider Registered",
        message: `New service provider ${name} needs verification.`,
        type: "verification",
        category: "Verification",
        priority: "medium",
      });
    }
  }

  // Generate token and set cookie
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
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

// User login
export const loginUser = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Email, password, and role are required.",
    });
  }

  // Find user by email and role
  const user = await User.findOne({ email, role })
    .select("name email password role status")
    .lean();

  if (!user) {
    // Check if email exists with different role
    const otherRoleUser = await User.findOne({ email });
    if (otherRoleUser) {
      // Security: Hide admin existence
      if (otherRoleUser.role === "admin") {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials.",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Email registered as ${otherRoleUser.role}. Login as ${otherRoleUser.role}.`,
      });
    }

    return res.status(400).json({
      success: false,
      message: "No account found with this email.",
    });
  }

  // Check account status
  if (user.status === "inactive") {
    return res.status(403).json({
      success: false,
      message: "Your account is inactive. Please contact the administrator.",
    });
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: "Incorrect password. Please try again.",
    });
  }

  // Generate token and set cookie
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

// Google OAuth login
export const googleLoginUser = async (req, res) => {
  try {
    const { token, role } = req.body;

    if (!token || !role) {
      return res.status(400).json({
        success: false,
        message: "Token and role are required",
      });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, email_verified, sub } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Create new user from Google account
      user = await User.create({
        name,
        email,
        password: null,
        image: picture, // Store Google profile image
        role,
        emailVerified: email_verified || false,
        googleId: sub,
      });

      // Send welcome notification for Google signup
      await createNotification(user._id, {
        title: "Welcome to Local Services System! 🎉",
        message: `Welcome ${name}! Your ${role} account has been created successfully with Google. ${getRoleSpecificMessage(
          role,
        )}`,
        type: "system",
        category: "User",
        priority: "high",
      });

      // Notify admins about Google registration
      const adminUsers = await User.find({ role: "admin" });
      for (const admin of adminUsers) {
        await createNotification(admin._id, {
          title: "New User Registration (Google)",
          message: `New ${role} registered via Google: ${name} (${email})`,
          type: "user",
          category: "User",
          priority: "medium",
        });
      }

      // Special handling for service providers
      if (role === "service-provider") {
        await createNotification(user._id, {
          title: "Service Provider Account Created",
          message:
            "Your service provider account is pending verification. Please submit your ID documents to start accepting bookings.",
          type: "verification",
          category: "Verification",
          priority: "high",
        });

        for (const admin of adminUsers) {
          await createNotification(admin._id, {
            title: "New Service Provider Registered",
            message: `New service provider ${name} needs verification.`,
            type: "verification",
            category: "Verification",
            priority: "medium",
          });
        }
      }
    } else {
      // Existing user - verify role match
      if (user.role !== role) {
        return res.status(400).json({
          success: false,
          message: `Email registered as ${user.role}. Login as ${user.role}.`,
        });
      }

      // Update profile image if missing
      if (!user.image && picture) {
        user.image = picture;
        await user.save();
      }
    }

    // Generate token and set cookie
    const jwtToken = generateToken(user);
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data
    res.status(200).json({
      success: true,
      message: "Google login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image || "",
        phone: user.phone || "",
        address: user.address || "",
        bio: user.bio || "",
        ...(user.role === "service-provider" && {
          isVerified: user.serviceProviderInfo?.isVerified || false,
          verificationStatus:
            user.serviceProviderInfo?.idVerification?.status || "not-submitted",
        }),
      },
    });
  } catch (error) {
    console.error("Google login error:", error);

    // Handle specific Google token errors
    if (error.message.includes("Token used too late")) {
      return res.status(400).json({
        success: false,
        message: "Google token expired. Please try again.",
      });
    }

    res.status(400).json({
      success: false,
      message: "Google authentication failed. Please try again.",
    });
  }
};

// Admin login
export const loginAdmin = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Email, password, and role are required.",
    });
  }

  const user = await User.findOne({ email, role })
    .select("name email password role")
    .lean();

  if (!user) {
    const otherRoleUser = await User.findOne({ email });
    if (otherRoleUser) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    return res.status(400).json({
      success: false,
      message: "No account found with this email.",
    });
  }

  // Check account status
  if (user.status === "inactive") {
    return res.status(403).json({
      success: false,
      message: "Your account is inactive. Please contact the administrator.",
    });
  }

  // Verify password
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

// Get current user profile
export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return user data without sensitive information
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
      isVerified: user.serviceProviderInfo?.isVerified || false,
      verificationStatus:
        user.serviceProviderInfo?.idVerification?.status || "not-submitted",
      rejectionReason:
        user.serviceProviderInfo?.idVerification?.rejectionReason || "",
    };

    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Error in getMe:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update user password
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash and save new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    // Notify user about password change
    await createNotification(userId, {
      title: "Password Changed Successfully 🔒",
      message:
        "Your account password has been updated successfully. If you didn't make this change, please contact support immediately.",
      type: "system",
      category: "System",
      priority: "high",
    });

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);

    await createNotification(req.user._id, {
      title: "Password Update Failed",
      message:
        "There was an error while trying to update your password. Please try again.",
      type: "system",
      category: "System",
      priority: "medium",
    });

    res.status(500).json({
      success: false,
      message: "Server error while updating password",
    });
  }
};

// Submit ID verification for service providers
export const submitIdVerification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { phonenumber, idType, idNumber } = req.body;

    // Only service providers can submit verification
    if (req.user.role !== "service-provider") {
      return res.status(403).json({
        success: false,
        message: "Only service providers can submit ID verification",
      });
    }

    if (!phonenumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Initialize service provider info if needed
    if (!user.serviceProviderInfo) {
      user.serviceProviderInfo = {
        isVerified: false,
        rating: 0,
        totalReviews: 0,
        completedJobs: 0,
        services: [],
        idVerification: {
          status: "not-submitted",
        },
      };
    }

    // Check for duplicate phone number (only on first submission or phone change)
    const currentStatus = user.serviceProviderInfo.idVerification.status;
    const isFirstTimeSubmission = currentStatus === "not-submitted";
    const isChangingPhoneNumber = user.phone !== phonenumber;

    if (isFirstTimeSubmission || isChangingPhoneNumber) {
      const existingUserWithPhone = await User.findOne({
        phone: phonenumber,
        _id: { $ne: userId },
        role: "service-provider",
      });

      if (existingUserWithPhone) {
        return res.status(400).json({
          success: false,
          message:
            "This phone number is already registered with another service provider account",
        });
      }
    }

    // Validate uploaded files
    if (!req.files || !req.files.frontImage || !req.files.backImage) {
      return res.status(400).json({
        success: false,
        message: "Both front and back ID images are required",
      });
    }

    const frontImageFile = req.files.frontImage[0];
    const backImageFile = req.files.backImage[0];

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];

    if (
      !allowedMimeTypes.includes(frontImageFile.mimetype) ||
      !allowedMimeTypes.includes(backImageFile.mimetype)
    ) {
      return res.status(400).json({
        success: false,
        message: "Only JPG, PNG, and PDF files are allowed",
      });
    }

    // Upload to Cloudinary
    const [frontImageResult, backImageResult] = await Promise.all([
      cloudinary.uploader.upload(frontImageFile.path, {
        folder: "id-verification",
      }),
      cloudinary.uploader.upload(backImageFile.path, {
        folder: "id-verification",
      }),
    ]);

    // Update user verification data
    user.phone = phonenumber;
    user.serviceProviderInfo.idVerification = {
      status: "pending",
      submittedAt: new Date(),
      idFrontImage: frontImageResult.secure_url,
      idBackImage: backImageResult.secure_url,
      idType: idType || "national-id",
      idNumber: idNumber || "",
      cloudinaryFrontId: frontImageResult.public_id,
      cloudinaryBackId: backImageResult.public_id,
      rejectionReason: undefined, // Clear previous rejection
    };

    await user.save();

    // Notify all admins about verification request
    const adminUsers = await User.find({ role: "admin" });
    for (const admin of adminUsers) {
      await createNotification(admin._id, {
        title: "New ID Verification Request",
        message: `Service provider ${user.name} (${user.email}) has submitted ID documents for verification.`,
        type: "verification",
        category: "Verification",
        priority: "medium",
        actionUrl: `/admin/service-providers`,
      });
    }

    res.status(200).json({
      success: true,
      message:
        "ID verification submitted successfully! Awaiting admin approval.",
      verificationStatus: "pending",
    });
  } catch (error) {
    console.error("Error submitting ID verification:", error);
    res.status(500).json({
      success: false,
      message: "Server error while submitting ID verification",
    });
  }
};

// Get ID verification status
export const getIdVerificationStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    // Only service providers can check status
    if (req.user.role !== "service-provider") {
      return res.status(403).json({
        success: false,
        message: "Only service providers can check verification status",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if verification has been submitted
    if (!user.serviceProviderInfo || !user.serviceProviderInfo.idVerification) {
      return res.json({
        success: true,
        verificationStatus: "not-submitted",
        message: "No ID verification submitted yet",
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
      hasFrontImage: !!verificationInfo.idFrontImage,
      hasBackImage: !!verificationInfo.idBackImage,
    });
  } catch (error) {
    console.error("Error getting verification status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching verification status",
    });
  }
};

// Send password reset OTP
export const sendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide email",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with that email",
      });
    }

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Clear old OTPs and save new one
    await PasswordReset.deleteMany({ email });
    await PasswordReset.create({ email, otp, expiresAt });

    // Send OTP email
    await sendOtpEmail(email, otp);

    res.status(200).json({
      success: true,
      message: "Reset OTP sent successfully to your email",
    });
  } catch (error) {
    console.error("sendResetOtp error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// Verify password reset OTP
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await PasswordReset.findOne({ email, otp });
    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("verifyResetOtp error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Reset password with verified OTP
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const record = await PasswordReset.findOne({ email, otp });
    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Clear used OTP
    await PasswordReset.deleteMany({ email });

    res.status(200).json({
      success: true,
      message: "Password reset successfully proceed to login",
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// User logout
export const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    path: "/",
    maxAge: 0,
  });
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

// Admin logout
export const logoutAdmin = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    path: "/",
    maxAge: 0,
  });
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};
