import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import Sidebar from "../componets/Sidebar";
import Navbar from "../componets/Navbar";

const Home = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // ADMIN AUTH PROTECTION 
  useEffect(() => {
    const checkAdminAuth = async () => {
      const isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn");
      const adminUser = localStorage.getItem("adminUser");
      
      if (!isAdminLoggedIn || !adminUser) {
        navigate("/admin/login");
        return;
      }

      try {
        // Verify with backend that user is still authenticated and is admin
        const { data } = await axios.get(`${backendUrl}/api/user/me`, {
          withCredentials: true,
        });

        if (!data.success || data.user.role !== "admin") {
          localStorage.removeItem("isAdminLoggedIn");
          localStorage.removeItem("adminUser");
          navigate("/admin/login");
          toast.error("Admin access required");
        }
      } catch (err) {
        localStorage.removeItem("isAdminLoggedIn");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
        toast.error("Session expired. Please login again.");
      }
    };

    checkAdminAuth();
  }, [navigate, backendUrl]);

 

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar for large screens */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Overlay Sidebar for small screens */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex bg-opacity-30">
          {/* Sidebar panel */}
          <div className="relative w-64 h-full shadow-md flex flex-col p-4">
            {/* Close button */}
            <button
              className="absolute top-5 -right-3 text-gray-600 hover:text-gray-900 text-xl"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>

            {/* Sidebar content */}
            <Sidebar onLinkClick={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 md:ml-0 overflow-y-auto">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main Page Wrapper */}
        <div className="p-6 mt-2 bg-gray-100 rounded-2xl min-h-[calc(100vh-4rem)] w-full md:max-w-6xl mx-auto overflow-y-auto">
                  <Outlet />
                </div>
      </div>
    </div>
  );
};

export default Home;