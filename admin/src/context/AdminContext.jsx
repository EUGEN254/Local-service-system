import { createContext, useContext, useEffect } from "react";
import { useAdminNotifications } from "../hooks/useAdminNotifications";
import { useAdminAuths } from "../hooks/useAdminAuths";

export const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const API_BASE = import.meta.env.VITE_BACKEND_URL;
  const notifications = useAdminNotifications();
  const { fetchUnreadCount, fetchUnreadBookingCount } = notifications;
  const auth = useAdminAuths();
  const { admin, fetchCurrentAdmin } = auth;

  // When admin becomes available, refresh notification-related counts
  useEffect(() => {
    if (admin) {
      fetchUnreadCount();
      fetchUnreadBookingCount();
    }
  }, [admin, fetchUnreadCount, fetchUnreadBookingCount]);

  // Check existing session on initial load
  useEffect(() => {
    fetchCurrentAdmin();
  }, [fetchCurrentAdmin]);

  // All context values
  const value = {
    API_BASE,
    ...auth,
    ...notifications,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};
