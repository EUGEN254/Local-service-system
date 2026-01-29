// sharedcontext/SharedContext.jsx
import { createContext, useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

export const ShareContext = createContext();

// Helper function to check if user is a service provider
const isServiceProvider = (user) => {
  return (
    user &&
    (user.role === "serviceprovider" || user.role === "service-provider")
  );
};

// the main component
const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL; //getting the server address
  const navigate = useNavigate();
  const currSymbol = "KES";

  const cachedUser = localStorage.getItem("user"); //check if userDat exist in browser
  const [user, setUser] = useState(cachedUser ? JSON.parse(cachedUser) : null);
  const [authLoading, setAuthLoading] = useState(false);
  const [verified, setIsVerified] = useState(false);

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  // Online users
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Chat unread messages
  const [unreadBySender, setUnreadBySender] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [bookingNotifications, setBookingNotifications] = useState([]);
  const [unreadBookingCount, setUnreadBookingCount] = useState(0);

  // ✅ ADDED: Notification system states
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Messages state for all chats
  const [messages, setMessages] = useState({}); // { chatId: [messages] }

  // Track the currently open chat room id (so incoming messages for the open chat
  // don't increment unread counters)
  const [activeRoomId, setActiveRoomId] = useState(null);
  const activeRoomIdRef = useRef(null);

  const socket = useRef();

  // ---------------- NOTIFICATION SYSTEM FUNCTIONS ----------------

  // Fetch notification unread count
  const fetchNotificationUnreadCount = async () => {
    if (!user) return; //function should run only if user is logged in

    try {
      const { data } = await axios.get(
        `${backendUrl}/api/notifications/unread-count`,
        { withCredentials: true },
      );

      if (data.success) {
        setNotificationUnreadCount(data.unreadCount); //update count
      }
    } catch (error) {
      console.error("Failed to fetch notification unread count:", error);
    }
  };

  // Fetch notifications with optional category filter
  const fetchNotifications = async (category = "All") => {
    if (!user) return;

    try {
      const { data } = await axios.get(
        `${backendUrl}/api/notifications?category=${category === "All" ? "" : category}`,
        { withCredentials: true },
      );

      if (data.success) {
        setNotifications(data.notifications);
      }
      return data;
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      throw error;
    }
  };

  // Mark single notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/notifications/mark-read/${notificationId}`,
        {},
        { withCredentials: true },
      );

      if (data.success) {
        setNotifications(
          (
            prev, //taking initial value of array
          ) =>
            prev.map(
              (
                n, //creating a new array going through each notification
              ) => (n._id === notificationId ? { ...n, read: true } : n),
            ),
        );
        setNotificationUnreadCount((prev) => Math.max(0, prev - 1));
      }
      return data;
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      throw error;
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/notifications/mark-all-read`,
        {},
        { withCredentials: true },
      );

      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setNotificationUnreadCount(0);
      }
      return data;
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      throw error;
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/notifications/${notificationId}`,
        { withCredentials: true },
      );

      if (data.success) {
        setNotifications((prev) =>
          prev.filter((n) => n._id !== notificationId),
        );
        // Update unread count if the deleted notification was unread
        const deletedNotification = notifications.find(
          (n) => n._id === notificationId,
        );
        if (deletedNotification && !deletedNotification.read) {
          setNotificationUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
      return data;
    } catch (error) {
      console.error("Failed to delete notification:", error);
      throw error;
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/notifications/bulk/delete-all`,
        { withCredentials: true },
      );

      if (data.success) {
        // Clear ALL notifications from state
        setNotifications([]);

        // Reset unread count to 0 (since all are gone)
        setNotificationUnreadCount(0);
      }
      return data;
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
      throw error;
    }
  };

  // ---------------- CHAT UNREAD COUNTS ----------------
  const fetchUnreadCounts = async () => {
    if (!user) return;

    try {
      const { data } = await axios.get(`${backendUrl}/api/chat/unread-count`, {
        withCredentials: true, //include login infromation that were create by cookie
      });

      if (data.success) {
        const countsMap = {}; //preparing storage
        let total = 0;

        data.unreadCounts.forEach((entry) => {
          countsMap[entry._id] = entry.count;
          total += entry.count;
        });

        setUnreadBySender(countsMap);
        setTotalUnread(total);
      }
    } catch (err) {
      console.error("Failed to fetch unread counts:", err.message);
    }
  };

  // ---------------- FETCH BOOKING NOTIFICATIONS ----------------
  const fetchBookingNotifications = async () => {
    if (!isServiceProvider(user)) return;

    try {
      const { data } = await axios.get(
        `${backendUrl}/api/chat/booking-notifications`,
        {
          withCredentials: true,
        },
      );

      if (data.success) {
        setBookingNotifications(data.notifications);
        setUnreadBookingCount(data.unreadCount);
      }
    } catch (err) {
      console.error("Failed to fetch booking notifications:", err);
    }
  };

  // ---------------- MARK BOOKING NOTIFICATION AS READ ----------------
  const markBookingNotificationAsRead = async (notificationId) => {
    try {
      await axios.post(
        `${backendUrl}/api/chat/mark-notification-read`,
        { notificationId },
        { withCredentials: true },
      );

      setBookingNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif,
        ),
      );
      setUnreadBookingCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // ---------------- MARK ALL NOTIFICATIONS AS READ ----------------
  const markAllBookingNotificationsAsRead = async () => {
    try {
      await axios.post(
        `${backendUrl}/api/chat/mark-all-notifications-read`,
        {},
        { withCredentials: true },
      );

      setBookingNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true })),
      );
      setUnreadBookingCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  // ---------------- SOCKET & REAL-TIME UPDATES ----------------
  useEffect(() => {
    if (!user) return;

    socket.current = io(backendUrl, { withCredentials: true });

    // Join main user room
    socket.current.emit("joinUserRoom", {
      userId: user._id,
      userName: user.name,
      userRole: user.role,
    });

    // Listen for online users
    socket.current.on("onlineUsers", (users) => {
      setOnlineUsers(users.map((id) => id.toString()));
    });

    // Listen for new messages
    socket.current.on("receiveMessage", (message) => {
      if (message.receiver === user._id) {
        // If the message belongs to the currently open chat, don't increment unread
        // counts — the chat container will handle marking it as read.
        if (
          activeRoomIdRef.current &&
          activeRoomIdRef.current === message.roomId
        ) {
          return;
        }

        // Update unread counts immediately when new message arrives
        setUnreadBySender((prev) => {
          const newCount = (prev[message.sender] || 0) + 1;
          return { ...prev, [message.sender]: newCount };
        });
        setTotalUnread((prev) => prev + 1);
      }
    });

    // Listen for new notifications
    socket.current.on("newNotification", (notificationData) => {
      // Add new notification
      setNotifications((prev) => {
        const newNotifications = [notificationData, ...prev];
        return newNotifications;
      });

      // Update unread count
      setNotificationUnreadCount((prev) => {
        const newCount = prev + 1;
        return newCount;
      });

      // Show toast notification
      toast.info(notificationData.message || "New notification received");
    });

    //socket handler with proper role checking
    socket.current.on("newBooking", (bookingData) => {
      const shouldReceiveNotification =
        isServiceProvider(user) &&
        user.name?.trim().toLowerCase() ===
          bookingData.providerName?.trim().toLowerCase();

      if (shouldReceiveNotification) {
        // Add new notification
        setBookingNotifications((prev) => {
          const newNotifications = [bookingData, ...prev];
          return newNotifications;
        });

        setUnreadBookingCount((prev) => {
          const newCount = prev + 1;
          return newCount;
        });

        // Show toast notification
        toast.info(
          `New booking: ${bookingData.serviceName} from ${bookingData.customerName}`,
        );
      }
    });

    return () => {
      socket.current.disconnect();
    };
  }, [user]);

  // Keep ref in sync with activeRoomId so socket listener access is stable
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  // ---------------- PERIODIC UNREAD COUNT FETCHING ----------------
  useEffect(() => {
    if (!user) return;

    // Fetch immediately
    fetchUnreadCounts();
    fetchNotificationUnreadCount();

    // Then fetch every 10 seconds for chat, 30 seconds for notifications
    const chatInterval = setInterval(fetchUnreadCounts, 10000);
    const notificationInterval = setInterval(
      fetchNotificationUnreadCount,
      30000,
    );

    return () => {
      clearInterval(chatInterval);
      clearInterval(notificationInterval);
    };
  }, [user]);

  // ---------------- AUTH & USER ----------------
  const fetchCurrentUser = async (showLoader = true) => {
    try {
      if (showLoader) setAuthLoading(true);

      const { data } = await axios.get(`${backendUrl}/api/user/me`, {
        withCredentials: true,
      });

      if (data.success && data.user) {
        setUser(data.user);

        // ✅ Set verified status based on the user data from backend
        const isUserVerified = data.user.isVerified === true;
        setIsVerified(isUserVerified);

        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("role", data.user.role);
      } else {
        setUser(null);
        setIsVerified(false);
        localStorage.removeItem("user");
        localStorage.removeItem("role");
      }
    } catch (err) {
      setUser(null);
      setIsVerified(false);
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    } finally {
      if (showLoader) setTimeout(() => setAuthLoading(false), 150);
    }
  };

  // Fetch notifications when user logs in
  useEffect(() => {
    if (isServiceProvider(user)) {
      fetchBookingNotifications();

      // Set up interval to fetch notifications periodically
      const interval = setInterval(fetchBookingNotifications, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  // ---------------- SERVICES ----------------
  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/serviceprovider/my-services`,
        { withCredentials: true },
      );
      if (data.success) setServices(data.services);
    } catch (err) {
      toast.error("Failed to load services");
    } finally {
      setLoadingServices(false);
    }
  };

  const addService = (service) => setServices((prev) => [service, ...prev]);
  const removeService = (id) =>
    setServices((prev) => prev.filter((s) => s._id !== id));

  // ---------------- MARK AS READ ----------------
  const markAsRead = async (senderId) => {
    if (!user || !senderId) return;

    try {
      // Update local state immediately
      setUnreadBySender((prev) => {
        const newCounts = { ...prev };
        if (newCounts[senderId]) {
          setTotalUnread((prevTotal) => prevTotal - newCounts[senderId]);
          delete newCounts[senderId];
        }
        return newCounts;
      });

      // Call API to mark as read
      await axios.post(
        `${backendUrl}/api/chat/mark-read`,
        { senderId },
        { withCredentials: true },
      );
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }
  };

  // ---------------- LOGOUT ----------------
  const logoutUser = async () => {
    try {
      setAuthLoading(true);
      
      // Call logout endpoint FIRST to clear server-side session
      const { data } = await axios.post(
        `${backendUrl}/api/user/logout`,
        {},
        { withCredentials: true },
      );

      // Clear local state and storage AFTER backend confirms logout
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      socket.current?.disconnect()

      if (data.success) {
        navigate("/", { replace: true });
        setTimeout(() => toast.success(data.message), 100);
      }
      
    } catch (err) {
      console.error("Logout error:", err);
      // Still clear local state even if backend fails
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      socket.current?.disconnect();
      navigate("/", { replace: true });
    } finally {
      setTimeout(() => setAuthLoading(false), 150);
    }
  };

  // Add this function to fetch categories
  const fetchCategories = async () => {
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
    }
  };

  // ---------------- VERIFY SESSION ----------------
  useEffect(() => {
    fetchCurrentUser(false);
    fetchCategories();
  }, []);

  const value = {
    backendUrl,
    user,
    setUser,
    fetchCategories,
    categories,
    fetchCurrentUser,
    showCustomCategory,
    logoutUser,
    authLoading,
    setAuthLoading,
    services,
    loadingServices,
    fetchServices,
    verified,
    addService,
    removeService,
    currSymbol,
    socket,
    onlineUsers,
    unreadBySender,
    totalUnread,
    messages,
    setMessages,
    fetchUnreadCounts,
    markAsRead,
    setUnreadBySender,
    setTotalUnread,
    bookingNotifications,
    unreadBookingCount,
    fetchBookingNotifications,
    markBookingNotificationAsRead,
    markAllBookingNotificationsAsRead,

    // ✅ ADDED: Notification system functions and states
    notificationUnreadCount,
    setNotificationUnreadCount,
    notifications,
    setNotifications,
    // currently-open chat room id (used by chat containers)
    activeRoomId,
    setActiveRoomId,
    fetchNotificationUnreadCount,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllNotifications,
  };

  return (
    <ShareContext.Provider value={value}>
      {props.children}
    </ShareContext.Provider>
  );
};

export default AppContextProvider;
