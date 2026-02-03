import axios from "axios";
import { API_BASE } from "../config/api.js";

/**
 * Admin Notification Service
 * Handles admin notification management
 */

export const fetchNotifications = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const { data } = await axios.get(
      `${API_BASE}/api/admin/notifications?${params}`,
      { withCredentials: true },
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const fetchUnreadCount = async () => {
  try {
    const { data } = await axios.get(
      `${API_BASE}/api/admin/notifications/unread-count`,
      { withCredentials: true },
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const { data } = await axios.put(
      `${API_BASE}/api/admin/notifications/${notificationId}/mark-read`,
      {},
      { withCredentials: true },
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const { data } = await axios.put(
      `${API_BASE}/api/admin/notifications/mark-all-read`,
      {},
      { withCredentials: true },
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const fetchUnreadBookingCount = async () => {
  try {
    const { data } = await axios.get(
      `${API_BASE}/api/admin/bookings/unread-count`,
      { withCredentials: true },
    );

    return data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const markAllBookingsAsRead = async () => {
  try {
    const { data } = await axios.put(
      `${API_BASE}/api/admin/bookings/mark-all-read`,
      {},
      { withCredentials: true },
    );
    return data;
  } catch (err) {
    throw err.response?.data || err;
  }
};
