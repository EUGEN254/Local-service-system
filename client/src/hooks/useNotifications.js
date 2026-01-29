import { useState, useCallback } from "react";
import * as notificationService from "../services/notificationService";

/**
 * useNotifications Hook
 * Manages notification state and operations
 */
export const useNotifications = (backendUrl) => {
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const fetchNotificationUnreadCount = useCallback(async () => {
    if (!backendUrl) return;
    try {
      const count = await notificationService.fetchNotificationUnreadCount(
        backendUrl
      );
      setNotificationUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [backendUrl]);

  const fetchNotifications = useCallback(
    async (category = "All") => {
      if (!backendUrl) return [];
      try {
        const data = await notificationService.fetchNotifications(
          backendUrl,
          category
        );
        setNotifications(data);
        return data;
      } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
    },
    [backendUrl]
  );

  const markNotificationAsRead = useCallback(
    async (notificationId) => {
      try {
        await notificationService.markNotificationAsRead(
          backendUrl,
          notificationId
        );
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
        setNotificationUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [backendUrl]
  );

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await notificationService.markAllNotificationsAsRead(backendUrl);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setNotificationUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [backendUrl]);

  const deleteNotification = useCallback(
    async (notificationId) => {
      try {
        await notificationService.deleteNotification(
          backendUrl,
          notificationId
        );
        const deletedNotification = notifications.find(
          (n) => n._id === notificationId
        );
        setNotifications((prev) =>
          prev.filter((n) => n._id !== notificationId)
        );
        if (deletedNotification && !deletedNotification.read) {
          setNotificationUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    },
    [backendUrl, notifications]
  );

  const deleteAllNotifications = useCallback(async () => {
    try {
      await notificationService.deleteAllNotifications(backendUrl);
      setNotifications([]);
      setNotificationUnreadCount(0);
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    }
  }, [backendUrl]);

  return {
    notificationUnreadCount,
    setNotificationUnreadCount,
    notifications,
    setNotifications,
    fetchNotificationUnreadCount,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllNotifications,
  };
};
