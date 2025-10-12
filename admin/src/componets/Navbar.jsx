import React, { useContext, useState, useEffect } from "react";
import {
  FaSignOutAlt,
  FaSearch,
  FaBell,
  FaBars,
  FaChevronDown,
} from "react-icons/fa";
import { AdminContext } from "../context/AdminContext";
import { assets } from "../assets/assets";

const Navbar = ({ onMenuClick }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { logoutAdmin, admin, loadingAdmin } = useContext(AdminContext);

  // Show loading state while admin data is being fetched
  if (loadingAdmin) {
    return (
      <div className="flex items-center justify-between m-1 mt-2 px-4 md:px-6 py-3 rounded-2xl bg-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden text-gray-700 text-xl p-2 rounded-lg hover:bg-gray-100"
            onClick={onMenuClick}
          >
            <FaBars />
          </button>
          <div className="flex flex-col">
            <div className="flex flex-col">
              <p className="font-semibold text-gray-800">Loading...</p>
              <p className="text-sm text-gray-500">Please wait</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between m-1 mt-2 px-4 md:px-6 py-3 rounded-2xl bg-white shadow-md">
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
            src={assets.avatar_icon}
            alt="logo"
            className="w-10 h-10 rounded-full"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex flex-col">
            <p className="font-semibold text-gray-800">
              {admin?.name || "Admin User"}
            </p>
            <p className="text-sm text-gray-500">{admin?.email || "admin@example.com"}</p>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Full search bar - visible on md+ */}
        <div className="hidden md:flex items-center bg-gray-100 px-3 py-2 rounded-lg w-64">
          <FaSearch className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none flex-1 text-gray-700"
          />
        </div>

        {/* Search icon only - visible on small screens */}
        <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
          <FaSearch className="text-gray-600 text-lg" />
        </button>

        {/* Notification bell */}
        <div className="relative bg-gray-100 p-2 rounded-lg cursor-pointer">
          <FaBell className="text-gray-600 text-lg" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
            3
          </span>
        </div>

        {/* User circle with dropdown */}
        <div className="relative cursor-pointer">
          <div
            className="flex items-center gap-1 bg-gray-100 px-3 py-2 rounded-full"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
              {admin?.name?.charAt(0).toUpperCase() || "A"}
            </div>

            <FaChevronDown className="text-gray-600 text-sm" />
          </div>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <button
                className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={logoutAdmin}
              >
                <FaSignOutAlt className="text-gray-600" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;