import React, { useContext } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
} from "react-icons/fa";

const navLinks = (logoutUser) => ({
  menu: [
    { name: "Dashboard", icon: <FaTachometerAlt />, path: "dashboard" },
    { name: "Earnings", icon: <FaDollarSign />, path: "earnings" },
    { name: "My Services", icon: <FaServicestack />, path: "my-services" },
    { name: "Inbox", icon: <FaInbox />, path: "inbox" },
    { name: "Analytics", icon: <FaChartLine />, path: "analytics" },
    { name: "Bookings Made", icon: <FaBell />, path: "notifications" },
  ],
  other: [
    { name: "Help", icon: <FaQuestionCircle />, path: "help" },
    { name: "Settings", icon: <FaCog />, path: "settings" },
    { name: "Logout", icon: <FaSignOutAlt />, danger: true, path: "/logout", onClick: logoutUser },
  ],
});

const Sidebar = ({ onLinkClick }) => {
  const { logoutUser, totalUnread, unreadBookingCount } = useContext(ShareContext);
  const location = useLocation();
  const links = navLinks(logoutUser);

  // ✅ Check if service provider is currently on the inbox page
  const isOnInboxPage = location.pathname.includes('/inbox');
  // ✅ Check if service provider is currently on the notifications page
  const isOnNotificationsPage = location.pathname.includes('/notifications');

  return (
    <div className="w-64 h-full bg-gray-100 shadow-md rounded-2xl m-0 md:m-3 flex flex-col p-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-yellow-500 text-white">
          <h1 className="text-sm font-extrabold tracking-tight text-center leading-tight">LSS</h1>
        </div>
        <h1 className="text-lg font-bold text-gray-800">
          Local <span className="text-yellow-500">Service</span> System
        </h1>
      </div>

      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-4">
          <p className="text-gray-400 text-xs font-semibold">MENU</p>
          <div className="flex-1 border-b border-gray-300"></div>
        </div>

        <ul className="space-y-1 pl-4">
          {links.menu.map((link, index) => (
            <li key={index} className="relative">
              <NavLink
                to={link.path}
                onClick={onLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-2 py-2 rounded-md transition cursor-pointer relative ${
                    isActive ? "bg-yellow-500 text-gray-900 font-semibold" : "text-gray-700 hover:text-gray-900"
                  }`
                }
              >
                {link.icon}
                <span>{link.name}</span>
                
                {/* ✅ Show unread message count for Inbox (when NOT on inbox page) */}
                {link.name === "Inbox" && totalUnread > 0 && !isOnInboxPage && (
                  <span className="absolute right-3 top-1 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-5 h-5 flex items-center justify-center">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
                
                {/* ✅ Show unread booking count for Bookings Made (when NOT on notifications page) */}
                {link.name === "Bookings Made" && unreadBookingCount > 0 && !isOnNotificationsPage && (
                  <span className="absolute right-3 top-1 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-5 h-5 flex items-center justify-center">
                    {unreadBookingCount > 99 ? "99+" : unreadBookingCount}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mb-20"></div>

        <div className="flex items-center gap-2 mb-4">
          <p className="text-gray-400 text-xs font-semibold">OTHER</p>
          <div className="flex-1 border-b border-gray-300"></div>
        </div>

        <ul className="space-y-1 pl-4">
          {links.other.map((link, index) =>
            link.danger ? (
              <li key={index}>
                <button
                  onClick={() => {
                    link.onClick();
                    onLinkClick?.();
                  }}
                  className="flex items-center gap-3 px-2 py-2 rounded-md transition cursor-pointer text-red-600 hover:bg-yellow-500 hover:text-gray-900 w-full text-left"
                >
                  {link.icon} {link.name}
                </button>
              </li>
            ) : (
              <li key={index}>
                <NavLink
                  to={link.path}
                  onClick={onLinkClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-2 py-2 rounded-md transition cursor-pointer ${
                      isActive ? "bg-yellow-500 text-gray-900 font-semibold" : "text-gray-700 hover:bg-yellow-500 hover:text-gray-900"
                    }`
                  }
                >
                  {link.icon} {link.name}
                </NavLink>
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;