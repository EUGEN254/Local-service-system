import React, { useContext, useRef, useState } from "react";
import { FaHome } from "react-icons/fa";
import { FiMail, FiLock, FiArrowLeft } from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ShareContext } from "../../sharedcontext/SharedContext";

const ForgetPassword = () => {
  const { backendUrl } = useContext(ShareContext);
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Auto move between OTP fields
  const handleInput = (e, index) => {
    if (e.target.value.length > 0 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && e.target.value === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").slice(0, 6).split("");
    paste.forEach((char, index) => {
      if (inputRefs.current[index]) inputRefs.current[index].value = char;
    });
  };

  // Step 1 — Send OTP
  const handleSendEmail = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/send-reset-otp`, { email });
      if (data.success) {
        toast.success(data.message);
        setIsEmailSent(true);
      } else toast.error(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 — Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = inputRefs.current.map((e) => e.value).join("");
    setIsLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/verify-reset-otp`, { email, otp: enteredOtp });
      if (data.success) {
        toast.success("OTP Verified");
        setOtp(enteredOtp);
        setIsOtpVerified(true);
      } else toast.error(data.message || "Invalid OTP");
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3 — Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/reset-password`, {
        email,
        otp,
        newPassword,
      });
      if (data.success) {
        toast.success(data.message);
        navigate("/");
      } else toast.error(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-100 px-4">
      {/* Header */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <NavLink
          to="/"
          className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition"
        >
          <FaHome />
          <span>Back Home</span>
        </NavLink>
      </div>

      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-yellow-400">Forgot Password</h1>
          <p className="text-gray-400 mt-2">
            {isOtpVerified
              ? "Create a new secure password"
              : isEmailSent
              ? "Enter the 6-digit OTP sent to your email"
              : "Enter your registered email address"}
          </p>
        </div>

        {/* Step 1: Email */}
        {!isEmailSent && (
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-gray-300">Email Address</label>
              <div className="flex items-center bg-gray-700 rounded-lg px-3 py-2">
                <FiMail className="text-gray-400 mr-2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-transparent text-gray-100 focus:outline-none placeholder-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {isEmailSent && !isOtpVerified && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-gray-400">Enter 6-digit code below:</p>
            <div
              className="flex justify-between"
              onPaste={handlePaste}
            >
              {Array(6)
                .fill(0)
                .map((_, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength="1"
                    onInput={(e) => handleInput(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-10 h-12 text-center text-lg font-semibold rounded-lg bg-gray-700 text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                ))}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {isOtpVerified && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-gray-300">New Password</label>
              <div className="flex items-center bg-gray-700 rounded-lg px-3 py-2">
                <FiLock className="text-gray-400 mr-2" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full bg-transparent text-gray-100 focus:outline-none placeholder-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>

      {/* Back to login link */}
      <div className="mt-6 text-sm text-gray-400">
        <NavLink
          to="/"
          className="flex items-center justify-center gap-2 text-yellow-400 hover:text-yellow-300 transition"
        >
          <FiArrowLeft /> Back to Login
        </NavLink>
      </div>
    </div>
  );
};

export default ForgetPassword;
