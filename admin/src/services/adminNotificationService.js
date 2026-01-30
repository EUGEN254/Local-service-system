import axios from "axios";

/**
 * Admin Notification Service
 * Handles notification management
 */

const API_BASE = import.meta.env.VITE_BACKEND_URL;

export const fetchNotifications = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const { data } = await axios.get(
      `${API_BASE}/api/notifications?${params}`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const fetchUnreadCount = async () => {
  try {
    const { data } = await axios.get(
      `${API_BASE}/api/notifications/unread-count`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const { data } = await axios.put(
      `${API_BASE}/api/notifications/mark-read/${notificationId}`,
      {},
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const { data } = await axios.put(
      `${API_BASE}/api/notifications/mark-all-read`,
      {},
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
