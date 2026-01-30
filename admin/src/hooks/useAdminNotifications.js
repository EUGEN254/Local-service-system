import { useState, useCallback } from "react";
import * as adminNotificationService from "../services/adminNotificationService";

/**
 * useAdminNotifications Hook
 * Manages notification data state and operations
 */
export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchNotifications = useCallback(async (filters = {}) => {
    setLoadingNotifications(true);
    try {
      const data = await adminNotificationService.fetchNotifications(filters);
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
      return data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await adminNotificationService.fetchUnreadCount();
      if (data.success) {
        setUnreadCount(data.unreadCount || 0);
      }
      return data;
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, []);

  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      const data = await adminNotificationService.markNotificationAsRead(notificationId);
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      return data;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      const data = await adminNotificationService.markAllNotificationsAsRead();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
      return data;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loadingNotifications,
    fetchNotifications,
    fetchUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };
};
