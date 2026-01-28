// models/userSchema.js
import mongoose from "mongoose";
import validator from "validator";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: [validator.isEmail, "Invalid email"],
    },
    password: { type: String },
    phone: { type: String },
    bio: { type: String, maxlength: 500 },
    address: { type: String },
    image: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["customer", "service-provider", "admin"],
      default: "customer",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    // Add Google-specific fields
    googleId: { type: String }, // Store Google ID
    emailVerified: { type: Boolean, default: false },

    // Service Provider Specific Fields
    serviceProviderInfo: {
      isVerified: { type: Boolean, default: false },
      verificationDate: { type: Date },
      services: [
        {
          serviceName: String,
          category: String,
          amount: Number,
          image: String,
          status: String,
          dateAdded: Date,
          serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" }, 
        },
      ],
      rating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      completedJobs: { type: Number, default: 0 },

      // ID Verification for Service Providers only
      idVerification: {
        status: {
          type: String,
          enum: ["pending", "verified", "rejected", "not-submitted"],
          default: "not-submitted",
        },
        submittedAt: { type: Date },
        verifiedAt: { type: Date },
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rejectionReason: { type: String },
        idFrontImage: { type: String },
        idBackImage: { type: String },
        idNumber: { type: String },
        idType: {
          type: String,
          enum: ["national-id", "passport", "driving-license", "other"],
          default: "national-id",
        },
        cloudinaryFrontId: { type: String }, // Store Cloudinary public ID
        cloudinaryBackId: { type: String }, // Store Cloudinary public ID
      },
    },
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
