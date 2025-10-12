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

const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  const currSymbol = "KES";

  const cachedUser = localStorage.getItem("user");
  const [user, setUser] = useState(cachedUser ? JSON.parse(cachedUser) : null);
  const [authLoading, setAuthLoading] = useState(false);
  const [verified, setIsVerified] = useState(false);

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Online users
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Unread messages
  const [unreadBySender, setUnreadBySender] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [bookingNotifications, setBookingNotifications] = useState([]);
  const [unreadBookingCount, setUnreadBookingCount] = useState(0);

  // ✅ ADDED: Messages state for all chats
  const [messages, setMessages] = useState({}); // { chatId: [messages] }

  const socket = useRef();

  // ---------------- FETCH UNREAD COUNTS ----------------
  const fetchUnreadCounts = async () => {
    if (!user) return;

    try {
      const { data } = await axios.get(`${backendUrl}/api/chat/unread-count`, {
        withCredentials: true,
      });

      if (data.success) {
        const countsMap = {};
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
    // FIXED: Use the helper function to check service provider role
    if (!isServiceProvider(user)) return;

    try {
      const { data } = await axios.get(
        `${backendUrl}/api/chat/booking-notifications`,
        {
          withCredentials: true,
        }
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
        { withCredentials: true }
      );

      setBookingNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadBookingCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // ---------------- MARK ALL NOTIFICATIONS AS READ ----------------
  const markAllNotificationsAsRead = async () => {
    try {
      await axios.post(
        `${backendUrl}/api/chat/mark-all-notifications-read`,
        {},
        { withCredentials: true }
      );

      setBookingNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
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
        // Update unread counts immediately when new message arrives
        setUnreadBySender((prev) => {
          const newCount = (prev[message.sender] || 0) + 1;
          return { ...prev, [message.sender]: newCount };
        });
        setTotalUnread((prev) => prev + 1);
      }
    });

    // FIXED: Updated newBooking socket handler with proper role checking
    socket.current.on("newBooking", (bookingData) => {
      // FIXED: Use helper function to check service provider role
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
          `New booking: ${bookingData.serviceName} from ${bookingData.customerName}`
        );
      }
    });

    return () => {
      socket.current.disconnect();
    };
  }, [user]);

  // ---------------- PERIODIC UNREAD COUNT FETCHING ----------------
  useEffect(() => {
    if (!user) return;

    // Fetch immediately
    fetchUnreadCounts();

    // Then fetch every 10 seconds (like SpChatSidebar)
    const interval = setInterval(fetchUnreadCounts, 10000);

    return () => clearInterval(interval);
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

        console.log("User verification status:", {
          isVerified: isUserVerified,
          verificationStatus: data.user.verificationStatus,
          rejectionReason: data.user.rejectionReason,
        });
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
        { withCredentials: true }
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
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }
  };

  // ---------------- LOGOUT ----------------
  const logoutUser = async () => {
    try {
      setAuthLoading(true);
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      socket.current?.disconnect();

      await axios.post(
        `${backendUrl}/api/user/logout`,
        {},
        { withCredentials: true }
      );
      navigate("/", { replace: true });
      setTimeout(() => toast.success("Logged out successfully"), 100);
    } catch (err) {
      console.log("Logout error:", err);
    } finally {
      setTimeout(() => setAuthLoading(false), 150);
    }
  };

  // ---------------- VERIFY SESSION ----------------
  useEffect(() => {
    fetchCurrentUser(false);
  }, []);

  const value = {
    backendUrl,
    user,
    setUser,
    fetchCurrentUser,
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
    markAllNotificationsAsRead,
  };

  return (
    <ShareContext.Provider value={value}>
      {props.children}
    </ShareContext.Provider>
  );
};

export default AppContextProvider;
