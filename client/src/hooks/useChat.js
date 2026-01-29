import { useState, useCallback } from "react";
import * as chatService from "../services/chatService";

/**
 * useChat Hook
 * Manages chat and booking notification state
 */
export const useChat = (backendUrl, user) => {
  const [unreadBySender, setUnreadBySender] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [bookingNotifications, setBookingNotifications] = useState([]);
  const [unreadBookingCount, setUnreadBookingCount] = useState(0);

  const fetchUnreadCounts = useCallback(async () => {
    if (!backendUrl || !user) return;
    try {
      const { countsMap, total } = await chatService.fetchUnreadCounts(
        backendUrl
      );
      setUnreadBySender(countsMap);
      setTotalUnread(total);
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  }, [backendUrl, user]);

  const fetchBookingNotifications = useCallback(async () => {
    if (!backendUrl || !user) return;
    try {
      const result = await chatService.fetchBookingNotifications(
        backendUrl,
        user
      );
      if (result) {
        setBookingNotifications(result.notifications);
        setUnreadBookingCount(result.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching booking notifications:", error);
    }
  }, [backendUrl, user]);

  const markBookingNotificationAsRead = useCallback(
    async (notificationId) => {
      try {
        await chatService.markBookingNotificationAsRead(
          backendUrl,
          notificationId
        );
        setBookingNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadBookingCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking booking notification as read:", error);
      }
    },
    [backendUrl]
  );

  const markAllBookingNotificationsAsRead = useCallback(async () => {
    try {
      await chatService.markAllBookingNotificationsAsRead(backendUrl);
      setBookingNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      setUnreadBookingCount(0);
    } catch (error) {
      console.error("Error marking all booking notifications as read:", error);
    }
  }, [backendUrl]);

  const markChatAsRead = useCallback(
    async (senderId) => {
      if (!user || !senderId) return;
      try {
        setUnreadBySender((prev) => {
          const newCounts = { ...prev };
          if (newCounts[senderId]) {
            setTotalUnread((prevTotal) =>
              prevTotal - newCounts[senderId]
            );
            delete newCounts[senderId];
          }
          return newCounts;
        });
        await chatService.markChatAsRead(backendUrl, senderId);
      } catch (error) {
        console.error("Error marking chat as read:", error);
      }
    },
    [backendUrl, user]
  );

  return {
    unreadBySender,
    setUnreadBySender,
    totalUnread,
    setTotalUnread,
    bookingNotifications,
    setBookingNotifications,
    unreadBookingCount,
    setUnreadBookingCount,
    fetchUnreadCounts,
    fetchBookingNotifications,
    markBookingNotificationAsRead,
    markAllBookingNotificationsAsRead,
    markChatAsRead,
  };
};
