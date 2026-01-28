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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4 py-8">
      {/* Header */}
      <div className="absolute top-6 left-6">
        <NavLink
          to="/"
          className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors group"
        >
          <div className="p-2 bg-gray-800/50 rounded-lg group-hover:bg-gray-800 transition-colors">
            <FaHome className="text-lg" />
          </div>
          <span className="font-medium">Back Home</span>
        </NavLink>
      </div>

      <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
        {/* Header with gradient */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-full bg-gradient-to-r from-amber-900/30 to-yellow-900/30 mb-4">
            <FiLock className="text-2xl text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="text-gray-400 mt-3">
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
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isEmailSent ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-400'}`}>
              1
            </div>
            <div className={`w-16 h-1 ${isEmailSent ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 'bg-gray-700'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isOtpVerified ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900' : isEmailSent ? 'bg-gray-700 text-gray-400' : 'bg-gray-800 text-gray-600'}`}>
              2
            </div>
            <div className={`w-16 h-1 ${isOtpVerified ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 'bg-gray-700'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isOtpVerified ? 'bg-gray-700 text-gray-400' : 'bg-gray-800 text-gray-600'}`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Email */}
        {!isEmailSent && (
          <form onSubmit={handleSendEmail} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <FiMail className="text-gray-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800/50 border border-gray-600 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg font-medium bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-gray-900 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 text-gray-900" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
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
              <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
                Enter the 6-digit code sent to your email
              </label>
              <div
                className="flex justify-between gap-3"
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
                      className="w-12 h-14 text-center text-2xl font-bold rounded-lg bg-gray-800/50 border border-gray-600 text-amber-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  ))}
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">
                Paste or type the OTP
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg font-medium bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-gray-900 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 text-gray-900" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
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
                className="text-sm text-amber-400 hover:text-amber-300 hover:underline transition-colors"
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
              <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <FiLock className="text-gray-500" />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-3 py-3 rounded-lg bg-gray-800/50 border border-gray-600 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Password must be at least 6 characters long
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg font-medium bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-gray-900 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 text-gray-900" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
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
          className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors group"
        >
          <div className="p-2 bg-gray-800/50 rounded-lg group-hover:bg-gray-800 transition-colors">
            <FiArrowLeft />
          </div>
          <span className="font-medium">Back to Login</span>
        </NavLink>
      </div>

      {/* Footer Note */}
      <div className="mt-8 text-center max-w-md">
        <p className="text-sm text-gray-600">
          Need help? Contact our support team at support@worklink.com
        </p>
      </div>
    </div>
  );
};

export default ForgetPassword;