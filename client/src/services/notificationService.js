import axios from "axios";


// Fetch notification unread count
export const fetchNotificationUnreadCount = async (backendUrl) => {
  try {
    const { data } = await axios.get(
      `${backendUrl}/api/notifications/unread-count`,
      { withCredentials: true }
    );
    return data.success ? data.unreadCount : 0;
  } catch (error) {
    console.error("Failed to fetch notification unread count:", error);
    throw error;
  }
};

// Fetch notifications with optional category filter
export const fetchNotifications = async (backendUrl, category = "All") => {
  try {
    const { data } = await axios.get(
      `${backendUrl}/api/notifications?category=${category === "All" ? "" : category}`,
      { withCredentials: true }
    );
    return data.success ? data.notifications : [];
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    throw error;
  }
};

// Mark single notification as read
export const markNotificationAsRead = async (backendUrl, notificationId) => {
  try {
    const { data } = await axios.put(
      `${backendUrl}/api/notifications/mark-read/${notificationId}`,
      {},
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (backendUrl) => {
  try {
    const { data } = await axios.put(
      `${backendUrl}/api/notifications/mark-all-read`,
      {},
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (backendUrl, notificationId) => {
  try {
    const { data } = await axios.delete(
      `${backendUrl}/api/notifications/${notificationId}`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    console.error("Failed to delete notification:", error);
    throw error;
  }
};

// Delete all notifications
export const deleteAllNotifications = async (backendUrl) => {
  try {
    const { data } = await axios.delete(
      `${backendUrl}/api/notifications/bulk/delete-all`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    console.error("Failed to delete all notifications:", error);
    throw error;
  }
};
