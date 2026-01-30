import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaDollarSign,
  FaServicestack,
  FaInbox,
  FaChartLine,
  FaQuestionCircle,
  FaCog,
  FaSignOutAlt,
  FaBell,
} from "react-icons/fa";
import { useAdmin } from "../context/AdminContext";
import { useAdminNotifications } from "../hooks/useAdminNotifications";

// Define nav links with relative paths for nested routes
const navLinks =(logoutAdmin)=>({
  menu: [
    { name: "Dashboard", icon: <FaTachometerAlt />, path: "dashboard" },
    { name: "Bookings", icon: <FaDollarSign />, path: "payment" }, 
    { name: "Categories", icon: <FaServicestack />, path: "service-categories" },
    { name: "Service Providers", icon: <FaInbox />, path: "service-providers" },
    { name: "User management", icon: <FaInbox />, path: "user-management" },
    { name: "Analytics", icon: <FaChartLine />, path: "analytics" },
    { name: "Notification", icon: <FaBell />, path: "notifications" },
  ],
  other: [
    { name: "Settings", icon: <FaCog />, path: "settings" },
    { name: "Logout", icon: <FaSignOutAlt />, danger: true, path: "/logout",onClick:logoutAdmin },
  ],
});

const Sidebar = ({ onLinkClick }) => {
  const { logoutAdmin } = useAdmin();
  const { unreadCount } = useAdminNotifications();
  const links = navLinks(logoutAdmin);
  const location = useLocation()

   const isOnNotificationsPage = location.pathname.includes('/admin/notifications');
  return (
    <div className="w-74 h-full bg-gray-900 text-white shadow-lg flex flex-col overflow-hidden">
      {/* Header - Matches User Sidebar */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-gray-900 font-bold text-lg">W</span>
          </div>
          <div>
            <div className="text-xl font-bold text-white">WorkLink</div>
            <div className="text-xs text-gray-400">Admin Dashboard</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Main Menu */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Main Menu</p>
            <div className="flex-1 border-b border-gray-700"></div>
          </div>

          <ul className="space-y-1">
            {links.menu.map((link, index) => (
              <li key={index} className="relative">
                <NavLink
                  to={link.path}
                  onClick={onLinkClick}
                  end={link.path === "dashboard"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors relative ${
                      isActive
                        ? "bg-white text-gray-900 font-semibold"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`
                  }
                >
                  {link.icon} {link.name}

                  {link.name === "Notification" && unreadCount > 0 && !isOnNotificationsPage && (
                    <span className="absolute right-3 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 min-w-5 text-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Other Menu */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Other</p>
            <div className="flex-1 border-b border-gray-700"></div>
            </div>

          <ul className="space-y-1">
            {links.other.map((link, index) => (
              <li key={index}>
                {link.danger ? (
                  <button
                    onClick={() => {
                      link.onClick();
                      onLinkClick?.();
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-colors ${
                      link.danger
                        ? "text-red-400 hover:bg-red-900/20 hover:text-red-300"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    {link.icon} {link.name}
                  </button>
                ) : (
                  <NavLink
                    to={link.path}
                    onClick={onLinkClick}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-white text-gray-900 font-semibold"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`
                    }
                  >
                    {link.icon} {link.name}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
