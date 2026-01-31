import React, { useContext } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ShareContext } from "../../sharedcontext/SharedContext";
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
  FaHome,
  FaUsers,
  FaBook,
} from "react-icons/fa";

const navLinks = (logoutUser, navigate) => ({
  menu: [
    {
      name: "Dashboard",
      icon: <FaTachometerAlt className="w-5 h-5" />,
      path: "dashboard",
    },
    {
      name: "Earnings",
      icon: <FaDollarSign className="w-5 h-5" />,
      path: "earnings",
    },
    {
      name: "My Services",
      icon: <FaServicestack className="w-5 h-5" />,
      path: "my-services",
    },
    { name: "Inbox", icon: <FaInbox className="w-5 h-5" />, path: "inbox" },
    {
      name: "Analytics",
      icon: <FaChartLine className="w-5 h-5" />,
      path: "analytics",
    },
    {
      name: "Bookings",
      icon: <FaBell className="w-5 h-5" />,
      path: "notifications",
    },
  ],
  other: [
    {
      name: "Home",
      icon: <FaHome className="w-5 h-5" />,
      path: "/",
      onClick: () => navigate("/"),
    },
    {
      name: "Help & Support",
      icon: <FaQuestionCircle className="w-5 h-5" />,
      path: "help",
    },
    { name: "Settings", icon: <FaCog className="w-5 h-5" />, path: "settings" },
    {
      name: "Logout",
      icon: <FaSignOutAlt className="w-5 h-5" />,
      danger: true,
      path: "/",
      onClick: () => {
        logoutUser();
        navigate("/");
      },
    },
  ],
});

const Sidebar = ({ collapsed = false, onLinkClick }) => {
  const { logoutUser, totalUnread, unreadBookingCount,user } =
    useContext(ShareContext);
  const location = useLocation();
  const navigate = useNavigate();
  const links = navLinks(logoutUser, navigate);

  // Check if service provider is currently on the inbox page
  const isOnInboxPage = location.pathname.includes("/inbox");
  // Check if service provider is currently on the notifications page
  const isOnNotificationsPage = location.pathname.includes("/notifications");

  return (
    <div
      className={`h-full bg-gray-900 text-white shadow-lg flex flex-col overflow-hidden transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div
        className={`border-b border-gray-700 flex-shrink-0 ${
          collapsed ? "p-4" : "p-6"
        }`}
      >
        {collapsed ? (
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mx-auto">
            <span className="text-gray-900 font-bold text-lg">W</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-gray-900 font-bold text-lg">W</span>
            </div>
            <div>
              <div className="text-xl font-bold text-white">WorkLink</div>
              <div className="text-xs text-gray-400">Provider Dashboard</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation - Scrollable area */}
      <div
        className={`flex-1 overflow-y-auto ${collapsed ? "px-2" : "px-4"} py-4`}
      >
        {/* Main Menu */}
        <div className="mb-6">
          {!collapsed && (
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Main Menu
              </p>
              <div className="flex-1 border-b border-gray-700"></div>
            </div>
          )}

          <ul className="space-y-1">
            {links.menu.map((link, index) => (
              <li key={index}>
                <NavLink
                  to={link.path}
                  onClick={onLinkClick}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-3 rounded-lg transition-colors relative ${
                      isActive
                        ? "bg-white text-gray-900 font-semibold"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    } ${collapsed ? "justify-center" : "gap-3"}`
                  }
                  end
                  title={collapsed ? link.name : ""}
                >
                  <span className="text-lg">{link.icon}</span>
                  {!collapsed && (
                    <span className="text-lg font-medium">{link.name}</span>
                  )}

                  {/* Unread message count for Inbox */}
                  {link.name === "Inbox" &&
                    totalUnread > 0 &&
                    !isOnInboxPage && (
                      <span
                        className={`absolute ${
                          collapsed
                            ? "-top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                            : "right-3 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 min-w-5 text-center"
                        }`}
                      >
                        {collapsed
                          ? totalUnread > 9
                            ? "9+"
                            : totalUnread
                          : totalUnread > 99
                          ? "99+"
                          : totalUnread}
                      </span>
                    )}

                  {/* Unread booking count for Bookings */}
                  {link.name === "Bookings" &&
                    unreadBookingCount > 0 &&
                    !isOnNotificationsPage && (
                      <span
                        className={`absolute ${
                          collapsed
                            ? "-top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                            : "right-3 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 min-w-5 text-center"
                        }`}
                      >
                        {collapsed
                          ? unreadBookingCount > 9
                            ? "9+"
                            : unreadBookingCount
                          : unreadBookingCount > 99
                          ? "99+"
                          : unreadBookingCount}
                      </span>
                    )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Other Menu - Removed mb-6 to prevent extra space */}
        <div>
          {!collapsed && (
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Other
              </p>
              <div className="flex-1 border-b border-gray-700"></div>
            </div>
          )}

          <ul className="space-y-1">
            {links.other.map((link, index) => (
              <li key={index}>
                {link.onClick ? (
                  <button
                    onClick={() => {
                      link.onClick();
                      onLinkClick?.();
                    }}
                    className={`flex items-center w-full px-3 py-3 rounded-lg transition-colors ${
                      link.danger
                        ? "text-red-400 hover:bg-red-900/20 hover:text-red-300"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    } ${collapsed ? "justify-center" : "gap-3"}`}
                    title={collapsed ? link.name : ""}
                  >
                    <span className="text-lg">{link.icon}</span>
                    {!collapsed && (
                      <span className="text-lg font-medium">{link.name}</span>
                    )}
                  </button>
                ) : (
                  <NavLink
                    to={link.path}
                    onClick={onLinkClick}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-white text-gray-900 font-semibold"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      } ${collapsed ? "justify-center" : "gap-3"}`
                    }
                    end
                    title={collapsed ? link.name : ""}
                  >
                    <span className="text-lg">{link.icon}</span>
                    {!collapsed && (
                      <span className="text-lg font-medium">{link.name}</span>
                    )}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* User Profile - Bottom (Hidden when collapsed) */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-700 flex-shrink-0 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-900 font-medium">SP</span>
            </div>
            <div>
               <p className="text-sm text-gray-400">{user?.name || "service provider"}</p>
              <p className="font-medium">{user?.Role || 'service provider'}</p>
             
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;