import axios from "axios";

// Send OTP for password reset
export const sendResetOtp = async (backendUrl, email) => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/user/send-reset-otp`,
      { email }
    );
    return data;
  } catch (err) {
    console.error("Failed to send reset OTP:", err);
    throw err;
  }
};

// Verify OTP
export const verifyResetOtp = async (backendUrl, email, otp) => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/user/verify-reset-otp`,
      { email, otp }
    );
    return data;
  } catch (err) {
    console.error("Failed to verify OTP:", err);
    throw err;
  }
};

// Reset password with OTP
export const resetPassword = async (backendUrl, email, otp, newPassword) => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/user/reset-password`,
      { email, otp, newPassword }
    );
    return data;
  } catch (err) {
    console.error("Failed to reset password:", err);
    throw err;
  }
};
