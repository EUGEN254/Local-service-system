import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
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

// Define nav links with relative paths for nested /sp routes
const navLinks = (logoutUser) => ({
  menu: [
    { name: "Dashboard", icon: <FaTachometerAlt />, path: "dashboard" },
    { name: "Earnings", icon: <FaDollarSign />, path: "earnings" },
    { name: "My Services", icon: <FaServicestack />, path: "my-services" },
    { name: "Inbox", icon: <FaInbox />, path: "inbox" },
    { name: "Analytics", icon: <FaChartLine />, path: "analytics" },
     { name: "Notification", icon: <FaBell />, path: "notifications" },
  ],
  other: [
    { name: "Help", icon: <FaQuestionCircle />, path: "help" },
    { name: "Settings", icon: <FaCog />, path: "settings" },
    { name: "Logout", icon: <FaSignOutAlt />, danger: true, path: "/logout", onClick: logoutUser },
  ],
});

const Sidebar = ({ onLinkClick }) => {
  const { logoutUser } = useContext(ShareContext);
  const links = navLinks(logoutUser);

  return (
    <div className="w-64 h-full bg-gray-100 shadow-md rounded-2xl m-0 md:m-3 flex flex-col p-4">
      {/* Logo + Title */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-yellow-500 text-white">
          <h1 className="text-sm font-extrabold tracking-tight text-center leading-tight">
            LSS
          </h1>
        </div>
        <h1 className="text-lg font-bold text-gray-800">
          Local <span className="text-yellow-500">Service</span> System
        </h1>
      </div>

      {/* Menu Section */}
      <div className="flex flex-col flex-1">
        {/* Menu Title */}
        <div className="flex items-center gap-2 mb-4">
          <p className="text-gray-400 text-xs font-semibold">MENU</p>
          <div className="flex-1 border-b border-gray-300"></div>
        </div>

        <ul className="space-y-1 pl-4">
          {links.menu.map((link, index) => (
            <li key={index}>
              <NavLink
                to={link.path}
                onClick={onLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-2 py-2 rounded-md transition cursor-pointer
                  ${
                    isActive
                      ? "bg-yellow-500 text-gray-900 font-semibold"
                      : "text-gray-700 hover:text-gray-900"
                  }`
                }
              >
                {link.icon} {link.name}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mb-20"></div>

        {/* Other Section */}
        <div className="flex items-center gap-2 mb-4">
          <p className="text-gray-400 text-xs font-semibold">OTHER</p>
          <div className="flex-1 border-b border-gray-300"></div>
        </div>

        <ul className="space-y-1 pl-4">
          {links.other.map((link, index) => (
            <li key={index}>
              {link.danger ? (
                <button
                  onClick={() => {
                    link.onClick(); // trigger logout
                    onLinkClick?.(); // close sidebar if small screen
                  }}
                  className="flex items-center gap-3 px-2 py-2 rounded-md transition cursor-pointer text-red-600 hover:bg-yellow-500 hover:text-gray-900 w-full text-left"
                >
                  {link.icon} {link.name}
                </button>
              ) : (
                <NavLink
                  to={link.path}
                  onClick={onLinkClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-2 py-2 rounded-md transition cursor-pointer
                    ${
                      isActive
                        ? "bg-yellow-500 text-gray-900 font-semibold"
                        : "text-gray-700 hover:bg-yellow-500 hover:text-gray-900"
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
  );
};

export default Sidebar;
