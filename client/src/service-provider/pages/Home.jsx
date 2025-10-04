import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const Home = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
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
              className="absolute top-6 -right-2 text-gray-700 hover:text-gray-900 text-xl"
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
        <div className="p-6 mt-2 bg-gray-100 rounded-2xl min-h-[calc(100vh-4rem)] w-full md:max-w-6xl mx-auto overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Home;
