import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";
import * as authService from "../services/authService";
import { toast } from "sonner";
import LoginSignUp from "../sharedcomponent/LoginSignUp";
import { useContext } from "react";
import { ShareContext } from "../sharedcontext/SharedContext";
import { useAuth } from "../hooks/useAuth";

const VerifyEmailPage = () => {
  const { token } = useParams();
  const { backendUrl } = useContext(ShareContext);
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [showLoginSignUp, setShowLoginSignUp] = useState(false);
  const { setUser } = useAuth();

  useEffect(() => {
    const verifyEmailToken = async () => {
      try {
        const response = await authService.verifyEmail(backendUrl, token);

        if (response.success) {
          setSuccess(true);
          setMessage(response.message);

          if (response.user?.emailVerified) {
            setUser(response.user);
            localStorage.setItem("user", JSON.stringify(response.user));
            localStorage.setItem("role", response.user.role);

            // Same redirect logic as onsubmitHandler
            const targetRoute =
              response.user.role === "customer"
                ? "/user/browse-services"
                : "/sp/dashboard";

            setTimeout(() => {
              navigate(targetRoute, { replace: true });
            }, 1500);
          }
        } else {
          setSuccess(false);
          setMessage(response.message);
        }
      } catch (error) {
        setSuccess(false);
        setMessage(error.message || "Verification failed. Please try again.");
      } finally {
        setVerifying(false);
      }
    };

    if (token) verifyEmailToken();
  }, [token, navigate, backendUrl, setUser]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8">
        {verifying ? (
          <div className="text-center">
            <FiLoader className="animate-spin text-5xl text-black mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Your Email
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your email address...
            </p>
          </div>
        ) : success ? (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="text-5xl text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified!
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">
              Redirecting to your dashboard...
            </p>
            <button
              onClick={() => {
                // Use stored user data for redirect if needed
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                  const user = JSON.parse(storedUser);
                  const path =
                    user.role === "customer"
                      ? "/user/dashboard"
                      : "/sp/dashboard";
                  navigate(path, { replace: true });
                }
              }}
              className="mt-6 inline-block text-gray-600 hover:text-gray-800 hover:underline bg-transparent border-none p-0"
            >
              Click here if not redirected
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiXCircle className="text-5xl text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => setShowLoginSignUp(true)}
              className="inline-block px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Back to Login
            </button>
            {showLoginSignUp && (
              <LoginSignUp
                initialState="Login"
                setShowAuthModal={setShowLoginSignUp}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
