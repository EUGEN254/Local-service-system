// src/pages/AdminLogin.jsx
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaUserShield } from "react-icons/fa";
import axios from "axios";
import { AdminContext } from "../context/AdminContext";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { fetchCurrentAdmin, backendUrl } = useContext(AdminContext);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return toast.error("Email and password are required");
    }

    setLoading(true);

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/login-admin`,
        {
          email,
          password,
          role: "admin",
        },
        {
          withCredentials: true,
        }
      );

      if (data.success && data.user) {
        if (data.user.role !== "admin") {
          toast.error("Access denied. Admin privileges required.");
          return;
        }

        localStorage.setItem("isAdminLoggedIn", "true");
        localStorage.setItem("adminUser", JSON.stringify(data.user));

        toast.success("Welcome back, Admin!");
        await fetchCurrentAdmin();
        navigate("/admin");
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-yellow-400 rounded-full mb-3">
            <FaUserShield className="text-white text-3xl" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Admin Login</h2>
          <p className="text-gray-500 text-sm mt-1">
            Sign in to manage your platform
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-2 rounded-lg transition-all ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          © {new Date().getFullYear()} LSS Admin Dashboard
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
