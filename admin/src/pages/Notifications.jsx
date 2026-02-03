import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaTrash, FaBell } from "react-icons/fa";
import { useAdmin } from "../context/AdminContext";


const categories = ["All", "User", "Service Provider", "Booking", "Transaction", "System", "Verification"];

const Notifications = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const {
    notifications,
    unreadCount,
    loadingNotifications,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useAdmin();

  useEffect(() => {
    fetchNotifications({ category: activeCategory === "All" ? "" : activeCategory });
  }, [activeCategory, fetchNotifications]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "booking":
        return "📅";
      case "transaction":
        return "💰";
      case "user":
        return "👤";
      case "service-provider":
        return "🔧";
      case "verification":
        return "✅";
      default:
        return "🔔";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredNotifications = activeCategory === "All" 
    ? notifications 
    : notifications.filter(n => n.category === activeCategory);

  return (
    <div className="w-full max-w-[1400px] mx-auto p-3 sm:p-6 space-y-6 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <FaBell className="text-2xl text-blue-500" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        <button
          onClick={markAllNotificationsAsRead}
          disabled={unreadCount === 0}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            unreadCount === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          Mark all as read
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {loadingNotifications ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-500 mt-2">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaBell className="text-4xl text-gray-300 mx-auto mb-3" />
            <p>No notifications found.</p>
            <p className="text-sm">Notifications will appear here when you have new activity.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <li
                key={notification._id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  notification.read ? "bg-white" : "bg-blue-50 border-l-4 border-blue-500"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 flex-1">
                    <span className="text-xl mt-1">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {notification.category}
                        </span>
                        {!notification.read && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 font-medium">{notification.title}</p>
                      <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {!notification.read && (
                      <button
                        onClick={() => markNotificationAsRead(notification._id)}
                        className="text-green-500 hover:text-green-700 text-sm flex items-center gap-1 p-2 rounded hover:bg-green-50"
                        title="Mark as read"
                      >
                        <FaCheckCircle size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;
