import React, { useContext, useRef, useState } from "react";
import { FaHome } from "react-icons/fa";
import { FiMail, FiLock, FiArrowLeft } from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ShareContext } from "../../sharedcontext/SharedContext";
import LoginSignUp from "../../sharedcomponent/LoginSignUp";

const ForgetPassword = () => {
  const { backendUrl } = useContext(ShareContext);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("Sign Up");
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/send-reset-otp`,
        { email },
      );
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

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = inputRefs.current.map((e) => e.value).join("");
    setIsLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/verify-reset-otp`,
        { email, otp: enteredOtp },
      );
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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/reset-password`,
        {
          email,
          otp,
          newPassword,
        },
      );
      if (data.success) {
        toast.success(data.message);
        setAuthMode("Login");
        setShowAuthModal(true);
      } else toast.error(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-800 px-4 py-8">
      {/* Header */}
      <div className="absolute top-6 left-6">
        <NavLink
          to="/"
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors group"
        >
          <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
            <FaHome className="text-lg" />
          </div>
          <span className="font-medium text-white">Back Home</span>
        </NavLink>
      </div>

      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-full mb-4">
            <FiLock className="text-2xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-600 mt-3 text-base">
            {isOtpVerified
              ? "Create a new secure password"
              : isEmailSent
                ? "Enter the 6-digit OTP sent to your email"
                : "Enter your registered email address to get started"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                isEmailSent
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              1
            </div>
            <div
              className={`w-16 h-1 ${
                isEmailSent ? "bg-gray-900" : "bg-gray-200"
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                isOtpVerified
                  ? "bg-gray-900 text-white"
                  : isEmailSent
                    ? "bg-gray-100 text-gray-400"
                    : "bg-gray-100 text-gray-300"
              }`}
            >
              2
            </div>
            <div
              className={`w-16 h-1 ${
                isOtpVerified ? "bg-gray-900" : "bg-gray-200"
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                isOtpVerified
                  ? "bg-gray-100 text-gray-400"
                  : "bg-gray-100 text-gray-300"
              }`}
            >
              3
            </div>
          </div>
        </div>

        {/* Step 1: Email */}
        {!isEmailSent && (
          <form onSubmit={handleSendEmail} className="space-y-6">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <FiMail className="text-gray-400 text-lg" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-3 py-3 text-base rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg font-medium bg-gray-900 hover:bg-gray-800 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Sending OTP...
                </>
              ) : (
                "Send OTP"
              )}
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {isEmailSent && !isOtpVerified && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2 text-center">
                Enter the 6-digit code sent to your email
              </label>
              <div className="flex justify-between gap-3" onPaste={handlePaste}>
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
                      className="w-12 h-14 text-center text-2xl font-bold rounded-lg border border-gray-300 text-gray-900 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:outline-none transition-all"
                    />
                  ))}
              </div>
              <p className="text-sm text-gray-500 text-center mt-3">
                Paste or type the OTP
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg font-medium bg-gray-900 hover:bg-gray-800 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => handleSendEmail({ preventDefault: () => {} })}
                className="text-base text-gray-900 hover:text-gray-700 hover:underline transition-colors"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {isOtpVerified && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <FiLock className="text-gray-400 text-lg" />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-3 py-3 text-base rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 focus:outline-none transition-all"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Password must be at least 6 characters long
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg font-medium bg-gray-900 hover:bg-gray-800 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}
      </div>

      {/* Back to login link */}
      <div className="mt-8 text-center">
        <NavLink
          to="/"
          className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors group text-base"
        >
          <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
            <FiArrowLeft />
          </div>
          <span className="font-medium text-white">Back to Login</span>
        </NavLink>
      </div>

      {/* Footer Note */}
      <div className="mt-8 text-center max-w-md">
        <p className="text-sm text-gray-100">
          Need help? Contact our support team at support@worklink.com
        </p>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="m-4 w-full max-w-md">
            <LoginSignUp
              initialState={authMode}
              setShowAuthModal={setShowAuthModal}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgetPassword;
