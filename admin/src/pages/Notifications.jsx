import React, { useState, useEffect, useContext } from "react";
import { FaCheckCircle, FaTrash, FaBell } from "react-icons/fa";
import { AdminContext } from "../context/AdminContext";
import axios from "axios";
import { toast } from "react-toastify";

const categories = ["All", "User", "Service Provider", "Booking", "Transaction", "Verification"];

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [unreadCount, setUnreadCount] = useState(0);
  
 
  const {backendUrl, admin } = useContext(AdminContext);

  const currentUser = admin;

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [currentUser, activeCategory]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${backendUrl}/api/notifications?category=${activeCategory === "All" ? "" : activeCategory}`,
        { withCredentials: true }
      );
      console.log(data);
      

      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/notifications/unread-count`,
        { withCredentials: true }
      );

      if (data.success) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/notifications/mark-read/${notificationId}`,
        {},
        { withCredentials: true }
      );

      if (data.success) {
        setNotifications(prev =>
          prev.map(n =>
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        toast.success("Notification marked as read");
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/notifications/mark-all-read`,
        {},
        { withCredentials: true }
      );

      if (data.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/notifications/${notificationId}`,
        { withCredentials: true }
      );

      if (data.success) {
        setNotifications(prev =>
          prev.filter(n => n._id !== notificationId)
        );
        // Update unread count if the deleted notification was unread
        const deletedNotification = notifications.find(n => n._id === notificationId);
        if (deletedNotification && !deletedNotification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        toast.success("Notification deleted");
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
    }
  };

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

  if (!currentUser) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please log in to view notifications</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <FaBell className="text-2xl text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        <button
          onClick={markAllAsRead}
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
      <div className="flex gap-2 mb-6 flex-wrap">
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
        {loading ? (
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
                        onClick={() => markAsRead(notification._id)}
                        className="text-green-500 hover:text-green-700 text-sm flex items-center gap-1 p-2 rounded hover:bg-green-50"
                        title="Mark as read"
                      >
                        <FaCheckCircle size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 p-2 rounded hover:bg-red-50"
                      title="Delete notification"
                    >
                      <FaTrash size={14} />
                    </button>
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