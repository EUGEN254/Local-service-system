import User from "../models/userSchema.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import { createNotification } from "./notificationController.js";
import PasswordReset from "../models/passwordReset.js";
import { sendOtpEmail } from "../utils/emailService.js";

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

  // Map user roles to notification categories
  const getNotificationCategory = (userRole) => {
    const categoryMap = {
      customer: "User",
      "service-provider": "Service Provider",
      admin: "System",
    };
    return categoryMap[userRole] || "System";
  };

  // ✅ Create welcome notification for the new user
  await createNotification(user._id, {
    title: "Welcome to Local Services System! 🎉",
    message: `Welcome ${name}! Your ${role} account has been created successfully. ${getRoleSpecificMessage(
      role
    )}`,
    type: "system",
    category: getNotificationCategory(role), // Use mapped category
    priority: "high",
  });

  // ✅ Create admin notification for new user registration
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

  // ✅ If user is a service provider, create verification notification
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
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

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

export const loginUser = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Email, password, and role are required.",
    });
  }

  // 🔹 Find user by email and role
  const user = await User.findOne({ email, role })
    .select("name email password role status")
    .lean();

  if (!user) {
    // Check if email exists with another role
    const otherRoleUser = await User.findOne({ email });
    if (otherRoleUser) {
      // 🔒 SECURITY: Don't reveal if the email belongs to an admin
      if (otherRoleUser.role === "admin") {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials.",
        });
      }

      // For non-admin roles, we can be more specific
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
  const user = await User.findOne({ email, role })
    .select("name email password role")
    .lean();

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
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
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
      verificationStatus:
        user.serviceProviderInfo?.idVerification?.status || "not-submitted",
      rejectionReason:
        user.serviceProviderInfo?.idVerification?.rejectionReason || "", // ✅ Add this
    };

    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Error in getMe:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

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

    // Find user by ID
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
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    // ✅ Create password change notification
    await createNotification(userId, {
      title: "Password Changed Successfully 🔒",
      message:
        "Your account password has been updated successfully. If you didn't make this change, please contact support immediately.",
      type: "system",
      category: "System",
      priority: "high", // High priority for security-related events
    });

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);

    // ✅ Create error notification for security awareness
    await createNotification(userId, {
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

export const submitIdVerification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { phonenumber, idType, idNumber } = req.body;

    // Check if user is a service provider
    if (req.user.role !== "service-provider") {
      return res.status(403).json({
        success: false,
        message: "Only service providers can submit ID verification",
      });
    }

    // Basic validation
    if (!phonenumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
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
          status: "not-submitted",
        },
      };
    }

    // 🔑 UPDATED: Only check for duplicate phone number if user is submitting for the first time
    // or if they're changing their phone number during resubmission
    const currentVerificationStatus =
      user.serviceProviderInfo.idVerification.status;
    const isFirstTimeSubmission = currentVerificationStatus === "not-submitted";
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

    // Check if files were uploaded
    if (!req.files || !req.files.frontImage || !req.files.backImage) {
      return res.status(400).json({
        success: false,
        message: "Both front and back ID images are required",
      });
    }

    const frontImageFile = req.files.frontImage[0];
    const backImageFile = req.files.backImage[0];

    // Validate file types
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

    // Upload images to Cloudinary
    const [frontImageResult, backImageResult] = await Promise.all([
      cloudinary.uploader.upload(frontImageFile.path, {
        folder: "id-verification",
      }),
      cloudinary.uploader.upload(backImageFile.path, {
        folder: "id-verification",
      }),
    ]);

    // Store old status for comparison
    const oldStatus = user.serviceProviderInfo.idVerification.status;

    // Update user data
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
    };

    // Clear rejection reason when resubmitting
    user.serviceProviderInfo.idVerification.rejectionReason = undefined;

    await user.save();

    // ✅ Create notification for ALL ADMINS about new verification request
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

// Keep the getIdVerificationStatus function the same as before
export const getIdVerificationStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if user is a service provider
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

    // If user doesn't have serviceProviderInfo, they haven't submitted anything
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
      // Optionally include image URLs if needed
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


/* =========================
   SEND RESET OTP - UPDATED
========================= */
export const sendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Please provide email" });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "No user found with that email" });

    // Generate OTP and expiry
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Remove old OTPs for this email
    await PasswordReset.deleteMany({ email });

    // Save new OTP
    await PasswordReset.create({ email, otp, expiresAt });

    // ✅ CHANGED: Use Brevo API instead of SMTP
    await sendOtpEmail(email, otp);

    res.status(200).json({
      success: true,
      message: "Reset OTP sent successfully to your email",
    });
  } catch (error) {
    console.error("sendResetOtp error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Server error" 
    });
  }
};
/* =========================
   VERIFY RESET OTP
========================= */
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await PasswordReset.findOne({ email, otp });
    if (!record)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    if (record.expiresAt < new Date())
      return res.status(400).json({ success: false, message: "OTP expired" });

    res
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("verifyResetOtp error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================
   RESET PASSWORD
========================= */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const record = await PasswordReset.findOne({ email, otp });
    if (!record)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    if (record.expiresAt < new Date())
      return res.status(400).json({ success: false, message: "OTP expired" });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await PasswordReset.deleteMany({ email }); // clear used OTP

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
