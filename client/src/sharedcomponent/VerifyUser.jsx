import React, { useState, useEffect, useContext } from "react";
import {
  FiMail,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import { ShareContext } from "../sharedcontext/SharedContext";
import * as authService from "../services/authService";
import { toast } from "sonner";

const VerifyUser = ({ open, onClose, email }) => {
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const { backendUrl } = useContext(ShareContext);

  useEffect(() => {
    let timer;
    if (open && !canResend && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [open, canResend, timeLeft]);

  const handleResendEmail = async () => {
    if (!canResend) return;

    setResending(true);
    try {
      const response = await authService.resendVerificationEmail(backendUrl, {
        email,
      });
      if (response.success) {
        toast.success("Verification email resent successfully!");
        setCanResend(false);
        setTimeLeft(60);
      } else {
        toast.error(response.message || "Failed to resend email");
      }
    } catch (error) {
      toast.error("Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };

  const handleCheckInbox = () => {
    window.open("https://mail.google.com", "_blank");
  };

  if (!open) return null;

  return (
    <div
      onclick={onClose}
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70]"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-auto overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-6 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <FiMail className="text-white text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Verify Your Email
          </h2>
          <p className="text-blue-100 text-sm">
            Almost there! We've sent a verification link to your email.
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-700 text-sm mb-3">
                We've sent a verification email to:
              </p>
              <p className="font-semibold text-gray-900 bg-white p-3 rounded-lg border border-gray-200 text-center">
                {email || "your email address"}
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <FiCheckCircle className="text-green-500 text-lg mt-0.5" />
              </div>
              <p className="text-sm text-gray-600">
                Click the verification button in the email to activate your
                account
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <FiAlertCircle className="text-yellow-500 text-lg mt-0.5" />
              </div>
              <p className="text-sm text-gray-600">
                If you don't see the email, check your spam folder
              </p>
            </div>
          </div>

          {/* Resend Section */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 mb-3">
              Didn't receive the email?
            </p>
            <div className="flex items-center justify-between">
              <button
                onClick={handleResendEmail}
                disabled={!canResend || resending}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  canResend && !resending
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {resending ? (
                  <>
                    <FiRefreshCw className="animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <FiRefreshCw />
                    <span>Resend Email</span>
                  </>
                )}
              </button>
              {!canResend && timeLeft > 0 && (
                <span className="text-sm text-gray-500">
                  Resend available in {timeLeft}s
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleCheckInbox}
              className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <FiMail />
              <span>Open Gmail</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
            >
              I'll verify later
            </button>
          </div>

          <p className="text-xs text-center text-gray-500 mt-4">
            The verification link will expire in 24 hours for security reasons.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyUser;
