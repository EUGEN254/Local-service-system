import { useAdmin } from "../context/AdminContext";

/**
 * useAdminNotifications Hook
 * Delegates notification state and actions to AdminContext to keep
 * a single source of truth across the admin app.
 */
export const useAdminNotifications = () => {
  const {
    notifications,
    unreadCount,
    loadingNotifications,
    fetchNotifications,
    fetchUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useAdmin();

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
