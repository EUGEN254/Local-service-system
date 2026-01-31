import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as adminAuthService from "../services/adminAuthService";

export const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // ========== AUTHENTICATION STATE ONLY ==========
  const cachedUser = localStorage.getItem("adminUser");
  const [admin, setAdmin] = useState(
    cachedUser ? JSON.parse(cachedUser) : null,
  );
  const [verified, setIsVerified] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const navigate = useNavigate();

  // ========== NOTIFICATION STATE ==========
  // Note: This should move to useAdminNotifications hook
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // ========== LEGACY STATES (for backward compatibility) ==========
  // These should be removed and use hooks instead
  const [serviceProviders, setServiceProviders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingAllBookings, setLoadingAllBookings] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [updatingProvider, setUpdatingProvider] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [updatingCategory, setUpdatingCategory] = useState(false);
  const [updatingBooking, setUpdatingBooking] = useState(false);
  const [addingProvider, setAddingProvider] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [bookingStats, setBookingStats] = useState(null);

  // ========== AUTHENTICATION FUNCTIONS ==========
  const logoutAdmin = async () => {
    try {
      setAuthLoading(true);
      setAdmin(null);
      setIsVerified(false);

      // Clear localStorage
      localStorage.removeItem("isAdminLoggedIn");
      localStorage.removeItem("adminUser");
      localStorage.removeItem("role");

      // Call backend logout
      await adminAuthService.logoutAdmin();

      toast.success("Logged out successfully");
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/", { replace: true });
    } finally {
      setTimeout(() => setAuthLoading(false), 150);
    }
  };

  const fetchCurrentAdmin = async (showLoader = true) => {
    try {
      if (showLoader) setAuthLoading(true);
      const data = await adminAuthService.getCurrentAdmin();

      if (data.success && data.user) {
        setAdmin(data.user);
        const isUserVerified = data.user.isVerified === true;
        setIsVerified(isUserVerified);

        localStorage.setItem("adminUser", JSON.stringify(data.user));
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("isAdminLoggedIn", "true");
      } else {
        setAdmin(null);
        setIsVerified(false);
        localStorage.removeItem("adminUser");
        localStorage.removeItem("role");
        localStorage.removeItem("isAdminLoggedIn");
      }
    } catch (err) {
      console.error("Failed to fetch admin:", err);
      setAdmin(null);
      setIsVerified(false);
      localStorage.removeItem("adminUser");
      localStorage.removeItem("role");
      localStorage.removeItem("isAdminLoggedIn");
    } finally {
      if (showLoader) setTimeout(() => setAuthLoading(false), 150);
    }
  };

  // ========== NOTIFICATION FUNCTIONS ==========
  const fetchNotifications = async (filters = {}) => {
    setLoadingNotifications(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const { data } = await axios.get(
        `${backendUrl}/api/notifications?${params}`,
        { withCredentials: true },
      );

      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        return data;
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/notifications/unread-count`,
        { withCredentials: true },
      );

      if (data.success) {
        setUnreadCount(data.unreadCount);
        return data.unreadCount;
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/notifications/mark-read/${notificationId}`,
        {},
        { withCredentials: true },
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
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/notifications/mark-all-read`,
        {},
        { withCredentials: true },
      );

      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        return true;
      }
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
    return false;
  };

  // ========== LEGACY FUNCTIONS (SHOULD USE HOOKS INSTEAD) ==========

  const fetchServiceProviders = async () => {
    setLoadingProviders(true);
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/admin/service-providers`,
        { withCredentials: true },
      );
      if (data.success) {
        setServiceProviders(data.serviceProviders);
      }
    } catch (err) {
      console.error("Failed to fetch service providers:", err);
      toast.error("Failed to load service providers");
    } finally {
      setLoadingProviders(false);
    }
  };

  const updateVerificationStatus = async (
    userId,
    status,
    rejectionReason = "",
  ) => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/admin/update-verification`,
        { userId, status, rejectionReason },
        { withCredentials: true },
      );

      if (data.success) {
        setServiceProviders((prev) =>
          prev.map((provider) =>
            provider._id === userId
              ? {
                  ...provider,
                  serviceProviderInfo: {
                    ...provider.serviceProviderInfo,
                    idVerification: {
                      ...provider.serviceProviderInfo?.idVerification,
                      status,
                      verifiedAt: status === "verified" ? new Date() : null,
                      rejectionReason:
                        status === "rejected" ? rejectionReason : "",
                    },
                    isVerified: status === "verified",
                  },
                }
              : provider,
          ),
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to update verification:", err);
      toast.error("Failed to update verification status");
      return false;
    }
  };

  const updateProviderProfile = async (providerId, formData) => {
    setUpdatingProvider(true);
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/admin/update-provider/${providerId}`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (data.success) {
        setServiceProviders((prev) =>
          prev.map((provider) =>
            provider._id === providerId
              ? { ...provider, ...data.user }
              : provider,
          ),
        );
        toast.success("Provider updated successfully!");
        return true;
      } else {
        toast.error(data.message || "Failed to update provider");
        return false;
      }
    } catch (err) {
      console.error("Failed to update provider:", err);
      toast.error(err.response?.data?.message || "Failed to update provider");
      return false;
    } finally {
      setUpdatingProvider(false);
    }
  };

  const createProvider = async (formData) => {
    setAddingProvider(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/admin/create-provider`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (data.success) {
        setServiceProviders((prev) => [data.user, ...prev]);
        toast.success("Service provider created successfully!");
        return true;
      } else {
        toast.error(data.message || "Failed to create provider");
        return false;
      }
    } catch (err) {
      console.error("Failed to create provider:", err);
      toast.error(err.response?.data?.message || "Failed to create provider");
      return false;
    } finally {
      setAddingProvider(false);
    }
  };

  const deleteProvider = async (providerId) => {
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/admin/delete-provider/${providerId}`,
        { withCredentials: true },
      );

      if (data.success) {
        setServiceProviders((prev) =>
          prev.filter((provider) => provider._id !== providerId),
        );
        toast.success("Provider deleted successfully!");
        return true;
      } else {
        toast.error(data.message || "Failed to delete provider");
        return false;
      }
    } catch (err) {
      console.error("Failed to delete provider:", err);
      toast.error(err.response?.data?.message || "Failed to delete provider");
      return false;
    }
  };

  const fetchCustomers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/customers`, {
        withCredentials: true,
      });
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      toast.error("Failed to load customers");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAdmins = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/admins`, {
        withCredentials: true,
      });
      if (data.success) {
        setAdmins(data.admins);
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
      toast.error("Failed to load admins");
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/admin/update-user-status`,
        { userId, status },
        { withCredentials: true },
      );

      if (data.success) {
        setCustomers((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, status } : user,
          ),
        );
        setAdmins((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, status } : user,
          ),
        );
        toast.success(`User status updated to ${status}`);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to update user status:", err);
      toast.error("Failed to update user status");
      return false;
    }
  };

  const updateUser = async (userId, formData) => {
    setUpdatingUser(true);
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/admin/update-user/${userId}`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (data.success) {
        setCustomers((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, ...data.user } : user,
          ),
        );
        setAdmins((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, ...data.user } : user,
          ),
        );
        toast.success("User updated successfully!");
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to update user:", err);
      toast.error(err.response?.data?.message || "Failed to update user");
      return false;
    } finally {
      setUpdatingUser(false);
    }
  };

  const createUser = async (formData) => {
    setAddingUser(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/admin/create-user`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (data.success) {
        if (data.user.role === "customer") {
          setCustomers((prev) => [data.user, ...prev]);
        } else if (data.user.role === "admin") {
          setAdmins((prev) => [data.user, ...prev]);
        }
        toast.success("User created successfully!");
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to create user:", err);
      toast.error(err.response?.data?.message || "Failed to create user");
      return false;
    } finally {
      setAddingUser(false);
    }
  };

  const deleteUser = async (userId, role) => {
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/admin/delete-user/${userId}`,
        { withCredentials: true },
      );

      if (data.success) {
        if (role === "customer") {
          setCustomers((prev) => prev.filter((user) => user._id !== userId));
        } else if (role === "admin") {
          setAdmins((prev) => prev.filter((user) => user._id !== userId));
        }
        toast.success("User deleted successfully!");
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to delete user:", err);
      toast.error(err.response?.data?.message || "Failed to delete user");
      return false;
    }
  };

  const refreshProviders = () => {
    fetchServiceProviders();
  };

  const refreshUsers = () => {
    fetchCustomers();
    fetchAdmins();
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/categories`, {
        withCredentials: true,
      });
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      toast.error("Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  const createCategory = async (formData) => {
    setAddingCategory(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/categories`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (data.success) {
        setCategories((prev) => [data.category, ...prev]);
        toast.success("Category created successfully!");
        return true;
      } else {
        toast.error(data.message || "Failed to create category");
        return false;
      }
    } catch (err) {
      console.error("Failed to create category:", err);
      toast.error(err.response?.data?.message || "Failed to create category");
      return false;
    } finally {
      setAddingCategory(false);
    }
  };

  const updateCategory = async (categoryId, formData) => {
    setUpdatingCategory(true);
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/categories/${categoryId}`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (data.success) {
        setCategories((prev) =>
          prev.map((category) =>
            category._id === categoryId ? data.category : category,
          ),
        );
        toast.success("Category updated successfully!");
        return true;
      } else {
        toast.error(data.message || "Failed to update category");
        return false;
      }
    } catch (err) {
      console.error("Failed to update category:", err);
      toast.error(err.response?.data?.message || "Failed to update category");
      return false;
    } finally {
      setUpdatingCategory(false);
    }
  };

  const deleteCategory = async (categoryId) => {
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/categories/${categoryId}`,
        { withCredentials: true },
      );

      if (data.success) {
        setCategories((prev) =>
          prev.filter((category) => category._id !== categoryId),
        );
        toast.success("Category deleted successfully!");
        return true;
      } else {
        toast.error(data.message || "Failed to delete category");
        return false;
      }
    } catch (err) {
      console.error("Failed to delete category:", err);
      toast.error(err.response?.data?.message || "Failed to delete category");
      return false;
    }
  };

  const toggleCategoryStatus = async (categoryId) => {
    try {
      const { data } = await axios.patch(
        `${backendUrl}/api/categories/${categoryId}/toggle-status`,
        {},
        { withCredentials: true },
      );

      if (data.success) {
        setCategories((prev) =>
          prev.map((category) =>
            category._id === categoryId ? data.category : category,
          ),
        );
        toast.success(data.message);
        return true;
      } else {
        toast.error(data.message || "Failed to update category status");
        return false;
      }
    } catch (err) {
      console.error("Failed to toggle category status:", err);
      toast.error("Failed to update category status");
      return false;
    }
  };

  const fetchBookings = async (filters = {}) => {
    setLoadingBookings(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const { data } = await axios.get(
        `${backendUrl}/api/admin/bookings?${params}`,
        { withCredentials: true },
      );

      if (data.success) {
        setBookings(data.bookings);
        return data;
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      toast.error("Failed to load bookings");
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchTransactions = async (filters = {}) => {
    setLoadingTransactions(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const { data } = await axios.get(
        `${backendUrl}/api/admin/transactions?${params}`,
        { withCredentials: true },
      );

      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      toast.error("Failed to load transactions");
    } finally {
      setLoadingTransactions(false);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    setUpdatingBooking(true);
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/admin/update-booking/${bookingId}`,
        { status },
        { withCredentials: true },
      );

      if (data.success) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking._id === bookingId ? { ...booking, status } : booking,
          ),
        );
        setAllBookings((prev) =>
          prev.map((booking) =>
            booking._id === bookingId ? { ...booking, status } : booking,
          ),
        );
        toast.success("Booking status updated!");
        return true;
      } else {
        toast.error(data.message || "Failed to update booking status");
        return false;
      }
    } catch (err) {
      console.error("Failed to update booking status:", err);
      toast.error(
        err.response?.data?.message || "Failed to update booking status",
      );
      return false;
    } finally {
      setUpdatingBooking(false);
    }
  };

  const fetchBookingStats = async () => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/admin/booking-stats`,
        { withCredentials: true },
      );

      if (data.success) {
        setBookingStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch booking stats:", err);
      toast.error("Failed to load booking statistics");
    }
  };

  const fetchAllBookings = async () => {
    setLoadingAllBookings(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/bookings`, {
        withCredentials: true,
      });

      if (data.success) {
        setAllBookings(data.bookings);
      }
    } catch (err) {
      console.error("Failed to fetch all bookings:", err);
      toast.error("Failed to load bookings");
    } finally {
      setLoadingAllBookings(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    if (!admin && localStorage.getItem("isAdminLoggedIn")) {
      fetchCurrentAdmin(false);
    }
    if (admin) {
      fetchUnreadCount();
    }
  }, []);

  // All context values
  const value = {
    backendUrl,
    logoutAdmin,
    admin,
    verified,
    fetchCurrentAdmin,
    authLoading,

    // Service Providers
    serviceProviders,
    loadingProviders,
    updatingProvider,
    addingProvider,
    fetchServiceProviders,
    updateVerificationStatus,
    updateProviderProfile,
    createProvider,
    deleteProvider,
    refreshProviders,

    // Users
    customers,
    admins,
    loadingUsers,
    updatingUser,
    addingUser,
    fetchCustomers,
    fetchAdmins,
    updateUserStatus,
    updateUser,
    createUser,
    deleteUser,
    refreshUsers,

    // Categories
    categories,
    loadingCategories,
    updatingCategory,
    addingCategory,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,

    // Bookings & Transactions
    bookings,
    transactions,
    loadingBookings,
    loadingTransactions,
    updatingBooking,
    bookingStats,
    allBookings,
    fetchAllBookings,
    loadingAllBookings,
    fetchBookings,
    fetchTransactions,
    updateBookingStatus,
    fetchBookingStats,

    // Notifications
    notifications,
    unreadCount,
    loadingNotifications,
    fetchNotifications,
    fetchUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};
