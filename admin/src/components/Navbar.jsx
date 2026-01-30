import React, { useState, useEffect } from "react";
import {
  FaSignOutAlt,
  FaSearch,
  FaBell,
  FaBars,
  FaChevronDown,
} from "react-icons/fa";
import { useAdmin } from "../context/AdminContext";
import { useAdminNotifications } from "../hooks/useAdminNotifications";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useAdminProviders } from "../hooks/useAdminProviders";
import { useAdminBookings } from "../hooks/useAdminBookings";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";

const Navbar = ({ onMenuClick }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { logoutAdmin, admin, authLoading } = useAdmin();
  const { unreadCount, fetchUnreadCount } = useAdminNotifications();
  const { customers } = useAdminUsers();
  const { serviceProviders: contextServiceProviders } = useAdminProviders();
  const { allBookings } = useAdminBookings();

  const navigate = useNavigate();

  // Refresh unread count periodically
  useEffect(() => {
    if (admin) {
      fetchUnreadCount();
      
      // Refresh every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [admin, fetchUnreadCount]);

  // Handle search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = [];

    // Search in customers
    customers.forEach((customer) => {
      if (
        customer.name?.toLowerCase().includes(lowerQuery) ||
        customer.email?.toLowerCase().includes(lowerQuery) ||
        customer.phone?.includes(query)
      ) {
        results.push({
          type: "customer",
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          icon: "fas fa-user",
          color: "text-blue-600"
        });
      }
    });

    // Search in service providers
    contextServiceProviders.forEach((provider) => {
      if (
        provider.name?.toLowerCase().includes(lowerQuery) ||
        provider.email?.toLowerCase().includes(lowerQuery) ||
        provider.phone?.includes(query)
      ) {
        results.push({
          type: "provider",
          id: provider._id,
          name: provider.name,
          email: provider.email,
          phone: provider.phone,
          icon: "fas fa-tools",
          color: "text-green-600"
        });
      }
    });

    // Search in bookings
    allBookings.forEach((booking) => {
      if (
        booking.customer?.name?.toLowerCase().includes(lowerQuery) ||
        booking.providerName?.toLowerCase().includes(lowerQuery) ||
        booking.serviceName?.toLowerCase().includes(lowerQuery) ||
        booking._id?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          type: "booking",
          id: booking._id,
          name: `${booking.customer?.name || "N/A"} - ${booking.serviceName}`,
          email: booking.serviceName,
          phone: booking.status,
          icon: "fas fa-calendar",
          color: "text-purple-600"
        });
      }
    });

    setSearchResults(results.slice(0, 10)); // Limit to 10 results
    setShowSearchResults(true);
  };

  // Handle result click
  const handleResultClick = (result) => {
    setSearchQuery("");
    setShowSearchResults(false);
    
    if (result.type === "customer") {
      navigate("/admin/user-management");
    } else if (result.type === "provider") {
      navigate("/admin/service-providers");
    } else if (result.type === "booking") {
      navigate("/admin/payment");
    }
  };

  // Close search results on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".search-container")) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showSearchResults]);

  // Show loading state while admin data is being fetched
  if (authLoading) {
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
            src={admin?.image || assets.avatar_icon}
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
        <div className="hidden md:block search-container relative">
          <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg w-64">
            <FaSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search customers, providers, bookings..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery && setShowSearchResults(true)}
              className="bg-transparent outline-none flex-1 text-gray-700 text-sm"
            />
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
              <div className="p-2">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md transition-colors mb-1 last:mb-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-md bg-gray-100 flex-shrink-0 ${result.color}`}>
                        <i className={`${result.icon} text-sm`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {result.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {result.email}
                        </p>
                        {result.phone && (
                          <p className="text-xs text-gray-400">
                            {result.type === "booking" ? `Status: ${result.phone}` : result.phone}
                          </p>
                        )}
                      </div>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded flex-shrink-0 capitalize">
                        {result.type}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {searchResults.length >= 10 && (
                <div className="px-3 py-2 border-t border-gray-200 text-center text-xs text-gray-500">
                  Showing 10 results. Refine your search for more.
                </div>
              )}
            </div>
          )}

          {showSearchResults && searchQuery && searchResults.length === 0 && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-6 text-center">
              <p className="text-gray-500 text-sm">No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Search icon only - visible on small screens */}
        <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
          <FaSearch className="text-gray-600 text-lg" />
        </button>

        {/* Notification bell */}
        <div 
        onClick={()=>navigate('/admin/notifications')}
        className="relative bg-gray-100 p-2 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
          <FaBell className="text-gray-600 text-lg" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        {/* User circle with dropdown */}
        <div className="relative cursor-pointer">
          <div
            className="flex items-center gap-1 bg-gray-100 px-3 py-2 rounded-full hover:bg-gray-200 transition-colors"
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
