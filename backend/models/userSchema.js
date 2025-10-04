import mongoose from "mongoose";
import validator from "validator";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: [validator.isEmail, "Invalid email"],
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "service-provider"],
      default: "customer",
    },
  },
  { timestamps: true }
);

const User = mongoose.models.user || mongoose.model('user',userSchema);

export default User;
