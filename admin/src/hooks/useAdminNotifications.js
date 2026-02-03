import { toast } from "sonner";
import * as adminNotificationService from "../services/adminNotificationService.js";
import { useCallback, useState, useEffect } from "react";

/**
 * useAdminNotifications Hook
 */
export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadBookingCount, setUnreadBookingCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  const fetchNotifications = useCallback(async (filters = {}) => {
    setLoadingNotifications(true);
    try {
      const data = await adminNotificationService.fetchNotifications(filters);
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        return data;
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await adminNotificationService.fetchUnreadCount();
      if (data.success) {
        setUnreadCount(data.unreadCount);
        return data.unreadCount;
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      const data =
        await adminNotificationService.markNotificationAsRead(
          notificationId,
        );

      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, read: true } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        return true;
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
    return false;
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      const data = await adminNotificationService.markAllNotificationsAsRead();

      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        // Also mark all bookings as read since they're tracked separately
        await adminNotificationService.markAllBookingsAsRead();
        setUnreadBookingCount(0);
        return true;
      }
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
    return false;
  }, []);

  const fetchUnreadBookingCount = useCallback(async () => {
    try {
      const data = await adminNotificationService.fetchUnreadBookingCount();
      if (data.success) {
        setUnreadBookingCount(data.unreadCount ?? 0);
        return data.unreadCount ?? 0;
      }
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  // Fetch counts on mount
  useEffect(() => {
    fetchUnreadCount();
    fetchUnreadBookingCount();
  }, [fetchUnreadCount, fetchUnreadBookingCount]);

  return {
    notifications,
    unreadCount,
    loadingNotifications,
    fetchNotifications,
    fetchUnreadCount,
    unreadBookingCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    fetchUnreadBookingCount,
  };
};
