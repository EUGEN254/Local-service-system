import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const Home = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar for large screens */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Overlay Sidebar for small screens */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/50">
          {/* Sidebar panel */}
          <div className="relative w-64 h-full bg-white shadow-xl">
            {/* Close button */}
            <button
              className="absolute top-4 right-4 z-50 text-gray-700 hover:text-gray-900 text-xl p-2"
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
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main content area with consistent width */}
        <div className="flex-1 bg-gray-50 overflow-y-auto">
          <div className="p-4 md:p-6 w-full mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;