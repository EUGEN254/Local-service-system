// controllers/adminControllers.js
import User from "../models/userSchema.js";
import bcrypt from "bcryptjs";
import {v2 as cloudinary} from 'cloudinary'

// Get all service providers
export const getServiceProviders = async (req, res) => {
  try {
    const serviceProviders = await User.find({ 
      role: "service-provider" 
    }).select("-password").sort({ createdAt: -1 });

    res.json({
      success: true,
      serviceProviders,
      total: serviceProviders.length
    });
  } catch (error) {
    console.error("Error fetching service providers:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching service providers"
    });
  }
};

// Update verification status
export const updateVerificationStatus = async (req, res) => {
  try {
    const { userId, status, rejectionReason } = req.body;

    if (!userId || !status) {
      return res.status(400).json({
        success: false,
        message: "User ID and status are required"
      });
    }

    const validStatuses = ["pending", "verified", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

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

    // Update verification status
    user.serviceProviderInfo.idVerification.status = status;
    
    if (status === "verified") {
      user.serviceProviderInfo.idVerification.verifiedAt = new Date();
      user.serviceProviderInfo.idVerification.verifiedBy = req.user._id;
      user.serviceProviderInfo.isVerified = true;
    } else if (status === "rejected") {
      user.serviceProviderInfo.idVerification.rejectionReason = rejectionReason || "";
      user.serviceProviderInfo.isVerified = false;
    } else if (status === "pending") {
      user.serviceProviderInfo.isVerified = false;
    }

    await user.save();

    res.json({
      success: true,
      message: `Verification status updated to ${status}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        serviceProviderInfo: user.serviceProviderInfo
      }
    });

  } catch (error) {
    console.error("Error updating verification status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating verification status"
    });
  }
};

// Update provider profile
export const updateProviderProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required"
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update basic fields
    user.name = name;
    user.email = email;
    user.phone = phone || user.phone;

    // Handle image upload if provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { 
        folder: "profiles" 
      });
      user.image = result.secure_url;
    }

    await user.save();

    res.json({
      success: true,
      message: "Provider updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Error updating provider:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating provider"
    });
  }
};

// Create new service provider
export const createProvider = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle image upload if provided
    let imageUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { 
        folder: "profiles" 
      });
      imageUrl = result.secure_url;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
      image: imageUrl,
      role: role || "service-provider",
      serviceProviderInfo: {
        isVerified: false,
        rating: 0,
        totalReviews: 0,
        completedJobs: 0,
        services: [],
        idVerification: {
          status: "not-submitted"
        }
      }
    });

    res.status(201).json({
      success: true,
      message: "Service provider created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Error creating provider:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating provider"
    });
  }
};

// Delete service provider
export const deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user is a service provider
    if (user.role !== "service-provider") {
      return res.status(400).json({
        success: false,
        message: "Can only delete service providers"
      });
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Service provider deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting provider:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting provider"
    });
  }
};



// Get all customers (users with role "customer")
export const getCustomers = async (req, res) => {
    try {
      const customers = await User.find({ 
        role: "customer" 
      }).select("-password").sort({ createdAt: -1 });
  
      res.json({
        success: true,
        customers,
        total: customers.length
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching customers"
      });
    }
  };
  
  // Get all admins
  export const getAdmins = async (req, res) => {
    try {
      const admins = await User.find({ 
        role: "admin" 
      }).select("-password").sort({ createdAt: -1 });
  
      res.json({
        success: true,
        admins,
        total: admins.length
      });
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching admins"
      });
    }
  };
  
  // Update user status (active/inactive)
  export const updateUserStatus = async (req, res) => {
    try {
      const { userId, status } = req.body;
  
      if (!userId || !status) {
        return res.status(400).json({
          success: false,
          message: "User ID and status are required"
        });
      }
  
      const validStatuses = ["active", "inactive"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status"
        });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
  
      user.status = status;
      await user.save();
  
      res.json({
        success: true,
        message: `User status updated to ${status}`,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        }
      });
  
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({
        success: false,
        message: "Server error while updating user status"
      });
    }
  };
  
  // Update user profile
  export const updateUser = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, role } = req.body;
  
      if (!name || !email || !role) {
        return res.status(400).json({
          success: false,
          message: "Name, email and role are required"
        });
      }
  
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
  
      // Check if email already exists (excluding current user)
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists"
        });
      }
  
      // Update fields
      user.name = name;
      user.email = email;
      user.phone = phone || user.phone;
      user.role = role;
  
      // Handle image upload if provided
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, { 
          folder: "profiles" 
        });
        user.image = result.secure_url;
      }
  
      await user.save();
  
      res.json({
        success: true,
        message: "User updated successfully",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          image: user.image
        }
      });
  
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({
        success: false,
        message: "Server error while updating user"
      });
    }
  };
  
  // Delete user
  export const deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
  
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
  
      // Prevent deleting yourself
      if (user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "You cannot delete your own account"
        });
      }
  
      await User.findByIdAndDelete(id);
  
      res.json({
        success: true,
        message: "User deleted successfully"
      });
  
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({
        success: false,
        message: "Server error while deleting user"
      });
    }
  };
  
  // Create new user (customer or admin)
  export const createUser = async (req, res) => {
    try {
      const { name, email, phone, password, role, status } = req.body;
  
      if (!name || !email || !password || !role) {
        return res.status(400).json({
          success: false,
          message: "Name, email, password and role are required"
        });
      }
  
      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists"
        });
      }
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Handle image upload if provided
      let imageUrl = "";
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, { 
          folder: "profiles" 
        });
        imageUrl = result.secure_url;
      }
  
      // Create user
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        phone: phone || "",
        image: imageUrl,
        role: role,
        status: status || "active"
      });
  
      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          image: user.image
        }
      });
  
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({
        success: false,
        message: "Server error while creating user"
      });
    }
  };