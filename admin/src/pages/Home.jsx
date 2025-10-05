import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../componets/Sidebar";
import Navbar from "../componets/Navbar";

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
        <div className="fixed inset-0 z-50 flex bg-black bg-opacity-40 backdrop-blur-sm">
          {/* Sidebar panel */}
          <div className="relative w-64 h-full shadow-lg bg-white flex flex-col p-4">
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
      <div className="flex flex-col flex-1 overflow-y-auto">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main Page Wrapper */}
        <div className="p-6 mt-2 bg-white rounded-2xl shadow-sm min-h-[calc(100vh-4rem)] w-full md:max-w-6xl mx-auto overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Home;
