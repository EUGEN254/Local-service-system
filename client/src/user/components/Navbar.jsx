import React, { useContext, useState } from "react";
import {
  FaSignOutAlt,
  FaBell,
  FaBars,
  FaChevronDown,
  FaInbox,
  FaTachometerAlt,
  FaCog,
} from "react-icons/fa";
import { ShareContext } from "../../sharedcontext/SharedContext";
import { assets } from "../../assets/assets";
import { useNavigate } from "react-router-dom";

const Navbar = ({ onMenuClick }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logoutUser, totalUnread, notificationUnreadCount } =
    useContext(ShareContext);


  return (
    <div className="flex ml-1 items-center justify-between px-4 md:px-9 py-3 bg-white shadow-md">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Hamburger for small screens */}
        <button
          className="md:hidden text-gray-700 text-xl p-2 rounded-lg hover:bg-gray-100"
          onClick={onMenuClick}
        >
          <FaBars />
        </button>

        <div className="hidden md:block">
          <img
            src={user?.image || assets.avatar_icon}
            alt="logo"
            className="w-10 h-10 rounded-full"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex flex-col">
            <p className="font-semibold text-gray-800 text-lg">
              {user?.name || "Loading..."}
            </p>
            <p className="text-base text-gray-500">{user?.email || ""}</p>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center justify-between gap-4">
        {/* chatbell */}
        <div
          onClick={() => navigate("/user/chat")}
          className="relative bg-gray-100 p-2 rounded-lg cursor-pointer"
        >
          <FaInbox className="text-gray-600 text-lg" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
            {totalUnread}
          </span>
        </div>

        {/* Notification bell - for system notifications */}
        <div
          onClick={() => navigate("/user/notification")}
          className="relative bg-gray-100 p-2 rounded-lg cursor-pointer"
        >
          <FaBell className="text-gray-600 text-lg" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
            {notificationUnreadCount}
          </span>
        </div>

        {/* User circle with dropdown */}
        <div className="relative cursor-pointer">
          <div
            className="flex items-center gap-1 bg-gray-100 px-3 py-2 rounded-full"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <FaChevronDown className="text-gray-600 text-sm" />
          </div>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-68 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
              <div className="p-3 border-b border-gray-100">
                <p className="text-lg font-medium text-gray-900">
                  {user?.name}
                </p>
                <p className="text-base text-gray-500 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    navigate("/user/dashboard");
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-base"
                >
                  <FaTachometerAlt className="text-gray-500" />
                  <span className="font-medium">Dashboard</span>
                </button>
                <button
                  onClick={() => {
                    navigate("/user/settings");
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-base"
                >
                  <FaCog className="text-gray-500" />
                  <span className="font-medium">Settings</span>
                </button>
                <button
                  className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-base"
                  onClick={logoutUser}
                >
                  <FaSignOutAlt className="text-red-500" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
