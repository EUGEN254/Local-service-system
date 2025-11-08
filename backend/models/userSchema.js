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
    password: { type: String, required: true },
    phone: { type: String },
    bio: { type: String, maxlength: 500 },
    address: { type: String },
    image: { type: String }, 
    role: {
      type: String,
      enum: ["customer", "service-provider", "admin"],
      default: "customer",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    
    // Service Provider Specific Fields
    serviceProviderInfo: {
      isVerified: { type: Boolean, default: false },
      verificationDate: { type: Date },
      services: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
      }],
      rating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      completedJobs: { type: Number, default: 0 },
      
      // ID Verification for Service Providers only
      idVerification: {
        status: {
          type: String,
          enum: ["pending", "verified", "rejected", "not-submitted"],
          default: "not-submitted"
        },
        submittedAt: { type: Date },
        verifiedAt: { type: Date },
        verifiedBy: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'User'
        },
        rejectionReason: { type: String },
        idFrontImage: { type: String },
        idBackImage: { type: String },
        idNumber: { type: String },
        idType: { 
          type: String, 
          enum: ["national-id", "passport", "driving-license", "other"],
          default: "national-id"
        }
      }
    }
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;