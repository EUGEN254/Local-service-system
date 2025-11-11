import mongoose from "mongoose";

const passwordResetSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

const PasswordReset =
  mongoose.models.PasswordReset || mongoose.model("PasswordReset", passwordResetSchema);

export default PasswordReset;
