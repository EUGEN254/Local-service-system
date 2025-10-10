// models/User.js
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
      enum: ["customer", "service-provider"],
      default: "customer",
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
