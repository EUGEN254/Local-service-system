import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { FaHome, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Home = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar for large screens - Collapsible */}
      <div className="hidden md:flex relative">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onLinkClick={() => setSidebarOpen(false)}
        />
        
        {/* Collapse/Expand Toggle Button - Desktop (on edge of sidebar) */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute top-6 -right-3 z-10 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-900 transition-colors border-2 border-white"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <FaChevronRight size={12} /> : <FaChevronLeft size={12} />}
        </button>
      </div>

      {/* Overlay Sidebar for small screens */}
      {sidebarOpen && (
        <>
          {/* Overlay backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          
          {/* Sidebar panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out md:hidden">
            <div className="relative h-full">
              {/* Close button */}
              <button
                className="absolute top-4 right-4 z-50 text-gray-300 hover:text-white text-xl p-2 rounded-full hover:bg-gray-800"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <FaChevronLeft />
              </button>

              {/* Sidebar content */}
              <Sidebar 
                collapsed={false} 
                onLinkClick={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          // Pass collapsed state to navbar if you want a toggle there too
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main content area */}
        <main className="flex-1 bg-gray-50 overflow-y-auto">
          {/* Back home button */}
          <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm py-4 px-4 md:px-6 border-b border-gray-200 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors group"
              aria-label="Go back to home"
            >
              <FaHome className="group-hover:scale-110 transition-transform" size={20} />
              <span className="text-lg font-semibold">Back Home</span>
            </button>
            
            {/* Desktop collapse toggle in header (optional) */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex items-center gap-2 text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <>
                  <FaChevronRight />
                  <span className="text-sm">Expand Sidebar</span>
                </>
              ) : (
                <>
                  <FaChevronLeft />
                  <span className="text-sm">Collapse Sidebar</span>
                </>
              )}
            </button>
          </div>

          {/* Main content container */}
          <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;