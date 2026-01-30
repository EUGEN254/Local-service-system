import React, { useState, useEffect, useContext } from "react";
import { FaCheckCircle, FaTrash, FaBell } from "react-icons/fa";
import { toast } from "react-toastify";
import { ShareContext } from "../../sharedcontext/SharedContext";
import { useNotifications } from "../../hooks/useNotifications";

const categories = ["All", "Booking", "Transaction"];

const UserNotification = () => {
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const itemsPerPage = 10;

  const { user, backendUrl } = useContext(ShareContext);
  
  // Use the notifications hook directly
  const {
    notificationUnreadCount,
    notifications,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    fetchNotificationUnreadCount,
    deleteAllNotifications,
  } = useNotifications(backendUrl);

  const currentUser = user;

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
      // Check for dark mode on mount
      const darkMode = localStorage.getItem('theme') === 'dark' || 
                       (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDarkMode(darkMode);
      
      // Listen for theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleThemeChange = (e) => setIsDarkMode(e.matches);
      mediaQuery.addListener(handleThemeChange);
      
      return () => mediaQuery.removeListener(handleThemeChange);
    }
  }, [currentUser, activeCategory]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchNotifications(activeCategory === "All" ? "" : activeCategory),
        fetchNotificationUnreadCount(),
      ]);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      toast.success("Notification marked as read");
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all notifications as read");
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      toast.success("Notification deleted");
    } catch (error) {
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

    if (diffInHours < 1) return "Just now";
    else if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    else return date.toLocaleDateString();
  };

  const openDeleteAllModal = () => {
    if (notifications.length === 0) return;
    setShowDeleteAllModal(true);
  };

  const closeDeleteAllModal = () => {
    setShowDeleteAllModal(false);
    setIsDeletingAll(false);
  };

  const handleDeleteAllNotifications = async () => {
    try {
      setIsDeletingAll(true);
      await deleteAllNotifications();
      toast.success("All notifications deleted");
      closeDeleteAllModal();
    } catch (error) {
      toast.error("Failed to delete all notifications");
    } finally {
      setIsDeletingAll(false);
    }
  };

  const filteredNotifications =
    activeCategory === "All"
      ? notifications
      : notifications.filter((n) => n.category === activeCategory);

  // Calculate pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!currentUser) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please log in to view notifications</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 text-gray-800">
        {/* Left Section */}
        <div className="flex items-center gap-3 flex-wrap">
          <FaBell className="text-2xl text-blue-500" />
          <h2 className="text-xl sm:text-2xl font-bold">
            Notifications
          </h2>
          {notificationUnreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {notificationUnreadCount} unread
            </span>
          )}
        </div>

        {/* Right Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={handleMarkAllAsRead}
            disabled={notificationUnreadCount === 0}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition-colors ${
              notificationUnreadCount === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            Mark all as read
          </button>

          <button
            onClick={openDeleteAllModal}
            disabled={notifications.length === 0}
            className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            <FaTrash size={14} /> Clear All
          </button>
        </div>
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
            <p className="text-sm">
              Notifications will appear here when you have new activity.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {paginatedNotifications.map((notification) => (
              <li
                key={notification._id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  notification.read
                    ? "bg-white"
                    : "bg-blue-50 border-l-4 border-blue-500"
                }`}
              >
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div className="flex gap-3 flex-1">
                    <span className="text-xl mt-1">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {notification.category}
                        </span>
                        {!notification.read && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 font-medium">
                        {notification.title}
                      </p>
                      <p className="text-gray-600 text-sm mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="text-green-500 hover:text-green-700 text-sm flex items-center gap-1 p-2 rounded hover:bg-green-50"
                        title="Mark as read"
                      >
                        <FaCheckCircle size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteNotification(notification._id)}
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

      {/* Pagination Controls */}
      {filteredNotifications.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
            <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredNotifications.length)}</span> of{' '}
            <span className="font-semibold">{filteredNotifications.length}</span> notifications
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                currentPage === 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                currentPage === totalPages
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal for deleting all notifications */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FaTrash className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Delete All Notifications
              </h3>
            </div>
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete all {notifications.length}{" "}
                notifications?
              </p>
              <p className="text-sm text-gray-500">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeDeleteAllModal}
                disabled={isDeletingAll}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllNotifications}
                disabled={isDeletingAll}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-red-300 flex items-center gap-2"
              >
                {isDeletingAll ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash size={14} />
                    Delete All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserNotification;
