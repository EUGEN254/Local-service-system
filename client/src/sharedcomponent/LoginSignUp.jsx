// src/sharedcomponent/LoginSignUp.jsx
import React, { useContext, useState } from "react";
import { FiMail, FiLock, FiUserPlus, FiAlertTriangle } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ShareContext } from "../sharedcontext/SharedContext";

const LoginSignUp = ({ initialState = "Sign Up", setShowAuthModal }) => {
  const [currState, setCurrState] = useState(initialState);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [role, setRole] = useState("customer");
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);
  const [pendingRole, setPendingRole] = useState("");

  const { backendUrl, fetchCurrentUser } = useContext(ShareContext);
  const navigate = useNavigate();

  // Handle role selection with confirmation
  const handleRoleSelect = (selectedRole) => {
    if (currState === "Sign Up") {
      // For sign up, show confirmation
      setPendingRole(selectedRole);
      setShowRoleConfirm(true);
    } else {
      // For login, just set the role
      setRole(selectedRole);
    }
  };

  // Confirm role selection
  const confirmRole = () => {
    setRole(pendingRole);
    setShowRoleConfirm(false);
    setPendingRole("");
  };

  // Cancel role selection
  const cancelRole = () => {
    setShowRoleConfirm(false);
    setPendingRole("");
  };
 
// In LoginSignUp.jsx - FIX
const onsubmitHandler = async (e) => {
  e.preventDefault();

  if (currState === "Sign Up" && !termsAccepted) {
    toast.error("Please accept the terms and conditions");
    return;
  }

  setIsLoading(true);

  try {
    let data;
    if (currState === "Sign Up") {
      const response = await axios.post(
        `${backendUrl}/api/user/register`,
        { name, email, password, termsAccepted, role },
        { withCredentials: true }
      );
      data = response.data;
    } else {
      const response = await axios.post(
        `${backendUrl}/api/user/login`,
        { email, password, role },
        { withCredentials: true, validateStatus: () => true }
      );
      data = response.data;
    }

    if (data.success) {
      await fetchCurrentUser();

      // Navigation and local actions
      const targetRoute = data.user.role === "customer" ? "/user" : "/sp";
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
    setIsLoading(false);
  }
};


  // Get role confirmation message
  const getRoleConfirmationMessage = () => {
    if (pendingRole === "customer") {
      return "You're selecting Customer role. Customers can book services, manage appointments, and communicate with service providers.";
    } else {
      return "You're selecting Service Provider role. Service providers can create service listings, manage bookings, and earn money through the platform.";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {/* Role Confirmation Modal */}
      {showRoleConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-60">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-auto border border-yellow-500/30">
            <div className="flex items-center mb-4">
              <FiAlertTriangle className="text-yellow-400 text-2xl mr-3" />
              <h3 className="text-xl font-bold text-gray-100">Confirm Your Role</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                {getRoleConfirmationMessage()}
              </p>
              <div className="bg-gray-700/50 rounded-lg p-4 border-l-4 border-yellow-400">
                <p className="text-yellow-300 font-semibold text-sm">
                  ⚠️ Important: Your role determines your dashboard features and cannot be easily changed later.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelRole}
                className="flex-1 py-3 px-4 rounded-lg bg-gray-600 hover:bg-gray-500 text-gray-100 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmRole}
                className="flex-1 py-3 px-4 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium transition"
              >
                Confirm {pendingRole === "customer" ? "Customer" : "Service Provider"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Auth Modal */}
      <div className="relative w-full max-w-md bg-gray-800 rounded-2xl shadow-lg p-6">
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-4 right-4 text-white text-4xl font-bold z-10 hover:text-yellow-400 transition"
        >
          &times;
        </button>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-100">{currState}</h2>
          <p className="text-gray-400 mt-1">
            {currState === "Login"
              ? "Welcome back! Enter your details."
              : "Join us today! Create an account."}
          </p>
        </div>

        <form onSubmit={onsubmitHandler} className="space-y-4">
          {/* Role Selector */}
          <div className="mb-4">
            <label className="block text-lg font-medium text-gray-300 mb-2">
              Select Role
            </label>
            <div className="flex gap-4">
              {["customer", "service-provider"].map((r) => (
                <div
                  key={r}
                  onClick={() => handleRoleSelect(r)}
                  className={`flex-1 cursor-pointer flex items-center justify-center gap-2 rounded-lg border-2 p-3 ${
                    role === r
                      ? "border-yellow-400 bg-gray-700"
                      : "border-gray-600 bg-gray-800"
                  } hover:border-yellow-300 transition`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => handleRoleSelect(r)}
                    className="h-5 w-5 text-yellow-400 focus:ring-yellow-400"
                  />
                  <span className="text-lg text-gray-100 capitalize">
                    {r === "customer" ? "Customer" : "Service Provider"}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {currState === "Login"
                ? `Logging in as ${
                    role === "customer" ? "Customer" : "Service Provider"
                  }`
                : `Signing up as ${
                    role === "customer" ? "Customer" : "Service Provider"
                  }`}
            </p>
            {currState === "Sign Up" && (
              <p className="text-xs text-yellow-400 mt-1">
                ⓘ Role selection requires confirmation during sign-up
              </p>
            )}
          </div>

          {/* Name (Sign Up only) */}
          {currState === "Sign Up" && (
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Full Name
              </label>
              <div className="flex items-center mt-1 rounded-lg bg-gray-700 px-3 py-2">
                <FiUserPlus className="text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent focus:outline-none text-gray-100 placeholder-gray-400"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Email Address
            </label>
            <div className="flex items-center mt-1 rounded-lg bg-gray-700 px-3 py-2">
              <FiMail className="text-gray-400 mr-2" />
              <input
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent focus:outline-none text-gray-100 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <FiLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                className="block w-full pl-10 pr-10 py-2 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-100"
              >
                {passwordVisible ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Terms checkbox (Sign Up only) */}
          {currState === "Sign Up" && (
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                required
                disabled={isLoading}
                checked={termsAccepted}
                onChange={() => setTermsAccepted(!termsAccepted)}
                className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-300 rounded mt-1"
              />
              <label htmlFor="terms" className="ml-3 text-sm text-gray-400">
                I agree to the{" "}
                <Link
                  to="/terms-conditions"
                  className="text-yellow-400 hover:text-yellow-300"
                >
                  Terms and Conditions
                </Link>
              </label>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || (currState === "Sign Up" && !termsAccepted)}
            className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-medium bg-yellow-400 hover:bg-yellow-500 text-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Processing..."
              : currState === "Login"
              ? "Sign In"
              : "Create Account"}
          </button>

          {/* Switch mode */}
          <div className="text-center text-sm text-gray-400">
            {currState === "Login" ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setCurrState("Sign Up")}
                  className="font-medium text-yellow-400 hover:text-yellow-300"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setCurrState("Login")}
                  className="font-medium text-yellow-400 hover:text-yellow-300"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginSignUp;