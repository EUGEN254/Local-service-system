import React, { useContext, useState } from "react";
import { FiMail, FiLock, FiUserPlus, FiAlertTriangle } from "react-icons/fi";
import { Link, NavLink, useNavigate } from "react-router-dom";
import * as authService from "../services/authService";
import { toast } from "react-toastify";
import { ShareContext } from "../sharedcontext/SharedContext";
import { GoogleLogin } from "@react-oauth/google";

const LoginSignUp = ({ initialState = "Sign Up", setShowAuthModal }) => {
  const [currState, setCurrState] = useState(initialState);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [role, setRole] = useState("customer");
  const [formLoading, setFormLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);
  const [pendingRole, setPendingRole] = useState("");

  const { backendUrl, fetchCurrentUser } = useContext(ShareContext);
  const navigate = useNavigate();

  const isLoading = formLoading || googleLoading;

  const handleRoleSelect = (selectedRole) => {
    if (currState === "Sign Up") {
      setPendingRole(selectedRole);
      setShowRoleConfirm(true);
      setRole(selectedRole);
    } else {
      setRole(selectedRole);
    }
  };

  const confirmRole = () => {
    setShowRoleConfirm(false);
    setPendingRole("");
  };

  const cancelRole = () => {
    setShowRoleConfirm(false);
    setPendingRole("");
    setRole("customer");
  };

  const getRoleConfirmationMessage = () => {
    if (pendingRole === "customer") {
      return "You're selecting Customer role. Customers can book services, manage appointments, and communicate with service providers.";
    } else {
      return "You're selecting Service Provider role. Service providers can create service listings, manage bookings, and earn money through the platform.";
    }
  };

  const onsubmitHandler = async (e) => {
    e.preventDefault();

    if (currState === "Sign Up" && !termsAccepted) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setFormLoading(true);

    try {
      let data;
      if (currState === "Sign Up") {
        data = await authService.register(backendUrl, { name, email, password, termsAccepted, role });
      } else {
        data = await authService.login(backendUrl, { email, password, role });
      }

      if (data.success) {
        await fetchCurrentUser();
        const targetRoute = data.user.role === "customer" ? "/user/browse-services" : "/sp";
        navigate(targetRoute, { replace: true });
        toast.success(data.message);
        if (setShowAuthModal) setShowAuthModal(false);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Action failed. Please try again.";
      toast.error(errorMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    if (currState === "Sign Up" && showRoleConfirm) {
      toast.error("Please confirm your role selection first");
      return;
    }

    setGoogleLoading(true);
    try {
      const data = await authService.googleLogin(backendUrl, { token: credentialResponse.credential, role });
      if (data.success) {
        toast.success("Logged in with Google successfully!");
        await fetchCurrentUser();
        const targetRoute = data.user.role === "customer" ? "/user/browse-services" : "/sp";
        navigate(targetRoute, { replace: true });
        if (setShowAuthModal) setShowAuthModal(false);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error("Google login error:", err);
      const errorMessage = err.response?.data?.message || "Google login failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      {/* Role Confirmation Modal */}
      {showRoleConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-xl shadow-2xl p-5 max-w-md w-full mx-auto border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <FiAlertTriangle className="text-blue-600 text-lg" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Confirm Your Role
              </h3>
            </div>

            <div className="mb-5">
              <p className="text-gray-700 mb-4 text-base">
                {getRoleConfirmationMessage()}
              </p>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-blue-700 font-medium text-sm">
                  Note: Your role determines your dashboard features and cannot be easily changed later.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelRole}
                className="flex-1 py-2.5 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors border border-gray-300 text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmRole}
                className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors text-base"
              >
                Confirm {pendingRole === "customer" ? "Customer" : "Service Provider"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Auth Modal - BALANCED VERSION */}
      <div className="relative w-full max-w-md bg-gray-100 rounded-xl shadow-lg p-5 overflow-y-scroll max-h-[95vh] custom-scrollbar">
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl transition-colors"
          disabled={isLoading}
        >
          &times;
        </button>

        <div className="mb-5 text-center">
          <h2 className="text-3xl font-bold text-gray-900">{currState}</h2>
          <p className="text-gray-600 mt-2 text-base">
            {currState === "Login"
              ? "Sign in to your account"
              : "Create a new account"}
          </p>
        </div>

        <form onSubmit={onsubmitHandler} className="space-y-4">
          {/* Role Selector */}
          <div className="mb-4">
            <label className="block text-base font-medium text-gray-700 mb-2">
              I am a...
            </label>
            <div className="flex gap-3">
              {["customer", "service-provider"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => !isLoading && handleRoleSelect(r)}
                  className={`flex-1 py-2.5 px-3 rounded-lg border transition-colors ${
                    role === r
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400"
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full ${
                      role === r ? "bg-blue-500" : "bg-gray-400"
                    }`}></div>
                    <span className="text-base font-medium capitalize">
                      {r === "customer" ? "Customer" : "Service Provider"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-base text-gray-500 mt-2">
              {currState === "Login"
                ? `You'll sign in as ${role === "customer" ? "Customer" : "Service Provider"}`
                : `You'll sign up as ${role === "customer" ? "Customer" : "Service Provider"}`}
            </p>
          </div>

          {/* Name (Sign Up only) */}
          {currState === "Sign Up" && (
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <FiUserPlus className="text-gray-400 text-base" />
                </div>
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-3 py-2.5 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <FiMail className="text-gray-400 text-base" />
              </div>
              <input
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-3 py-2.5 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <FiLock className="text-gray-400 text-base" />
              </div>
              <input
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2.5 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => !isLoading && setPasswordVisible(!passwordVisible)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-base disabled:opacity-50"
                disabled={isLoading}
              >
                {passwordVisible ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          {currState !== "Sign Up" && (
            <div className="text-right">
              <NavLink
                to="/forget-password"
                className="text-base text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                Forgot password?
              </NavLink>
            </div>
          )}

          {/* Terms Checkbox */}
          {currState === "Sign Up" && (
            <div className="flex items-start space-x-2">
              <input
                id="terms"
                type="checkbox"
                required
                disabled={isLoading}
                checked={termsAccepted}
                onChange={() => !isLoading && setTermsAccepted(!termsAccepted)}
                className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the{" "}
                <Link
                  to="/terms-conditions"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Terms and Conditions
                </Link>
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || (currState === "Sign Up" && !termsAccepted)}
            className="w-full py-3 px-4 rounded-lg font-medium bg-gray-900 hover:bg-gray-800 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base"
          >
            {formLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Processing...
              </>
            ) : currState === "Login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>

          {/* Switch Mode */}
          <div className="text-center text-base text-gray-600">
            {currState === "Login" ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => !isLoading && setCurrState("Sign Up")}
                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-base"
                  disabled={isLoading}
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => !isLoading && setCurrState("Login")}
                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-base"
                  disabled={isLoading}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center my-5">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="px-3 text-base text-gray-500">Or continue with</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Google Login */}
        <div className="relative">
          <div className={googleLoading ? 'opacity-50' : ''}>
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => !googleLoading && toast.error("Google login failed")}
              disabled={isLoading}
              shape="rectangular"
              size="large"
              width="100%"
            />
          </div>
          
          {/* Google Loading Overlay */}
          {googleLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-lg">
              <div className="text-center">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                <p className="text-sm text-gray-600">Signing in with Google...</p>
              </div>
            </div>
          )}
          
          {/* Role Reminder */}
          <div className="mt-3 text-center">
            <p className="text-sm text-gray-600">
              Google login will use:{" "}
              <span className="font-medium text-blue-600">
                {role === "customer" ? "Customer" : "Service Provider"}
              </span>{" "}
              role
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSignUp;