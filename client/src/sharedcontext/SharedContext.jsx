// sharedcontext/SharedContext.jsx
import { createContext, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

// Import custom hooks
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";

export const ShareContext = createContext();

// the main component
const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  const currSymbol = "KES";

  // Initialize essential hooks
  const authState = useAuth(backendUrl, navigate);
  const { user, authLoading, verified, fetchCurrentUser, logoutUser } =
    authState;

  const chatState = useChat(backendUrl, user);
  const {
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
  } = chatState;

  // Online users
  const onlineUsersRef = useRef([]);

  // Messages state for all chats
  const messagesRef = useRef({});
  const setMessages = (value) => {
    if (typeof value === "function") {
      messagesRef.current = value(messagesRef.current);
    } else {
      messagesRef.current = value;
    }
  };

  const activeRoomIdRef = useRef(null);
  const activeRoomId = activeRoomIdRef.current;
  const setActiveRoomId = (value) => {
    activeRoomIdRef.current = value;
  };

  const socket = useRef();

  // Helper function to check if user is a service provider
  const isServiceProvider = (user) => {
    return (
      user &&
      (user.role === "serviceprovider" || user.role === "service-provider")
    );
  };

  // Helper to get messages
  const messages = messagesRef.current;
  
  // Online users for context
  const onlineUsers = onlineUsersRef.current;
  const setOnlineUsers = (users) => {
    onlineUsersRef.current = users.map((id) => id.toString());
  };

  // ---------- SOCKET SETUP & REAL-TIME UPDATES ----------
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
      setOnlineUsers(users);
    });

    // Listen for new messages
    socket.current.on("receiveMessage", (message) => {
      if (message.receiver === user._id) {
        if (
          activeRoomIdRef.current &&
          activeRoomIdRef.current === message.roomId
        ) {
          return;
        }

        setUnreadBySender((prev) => {
          const newCount = (prev[message.sender] || 0) + 1;
          return { ...prev, [message.sender]: newCount };
        });
        setTotalUnread((prev) => prev + 1);
      }
    });

    // Listen for new bookings
    socket.current.on("newBooking", (bookingData) => {
      const shouldReceiveNotification =
        isServiceProvider(user) &&
        user.name?.trim().toLowerCase() ===
          bookingData.providerName?.trim().toLowerCase();

      if (shouldReceiveNotification) {
        setBookingNotifications((prev) => [bookingData, ...prev]);
        setUnreadBookingCount((prev) => prev + 1);
        toast.info(
          `New booking: ${bookingData.serviceName} from ${bookingData.customerName}`
        );
      }
    });

    return () => {
      socket.current.disconnect();
    };
  }, [user, isServiceProvider, setUnreadBySender, setTotalUnread, setBookingNotifications, setUnreadBookingCount]);

  // ---------- PERIODIC UNREAD COUNT FETCHING ----------
  useEffect(() => {
    if (!user) return;

    // Fetch immediately
    fetchUnreadCounts();

    // Then fetch every 10 seconds for chat
    const chatInterval = setInterval(fetchUnreadCounts, 10000);

    return () => {
      clearInterval(chatInterval);
    };
  }, [user, fetchUnreadCounts]);

  // ---------- FETCH BOOKING NOTIFICATIONS FOR SERVICE PROVIDERS ----------
  useEffect(() => {
    if (isServiceProvider(user)) {
      fetchBookingNotifications();
      const interval = setInterval(fetchBookingNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isServiceProvider, fetchBookingNotifications]);

  // ---------- VERIFY SESSION ----------
  useEffect(() => {
    fetchCurrentUser(false);
  }, [fetchCurrentUser]);

  // ---------- CONTEXT VALUE ----------
  const value = {
    // Essential global items
    backendUrl,
    currSymbol,
    user,
    authLoading,
    verified,
    fetchCurrentUser,
    logoutUser,

    // Socket & Real-time communication
    socket,
    onlineUsers,
    messages,
    setMessages,
    activeRoomId,
    setActiveRoomId,

    // Chat/Messaging
    unreadBySender,
    setUnreadBySender,
    totalUnread,
    setTotalUnread,
    fetchUnreadCounts,
    markChatAsRead,

    // Booking Notifications (service providers)
    bookingNotifications,
    setBookingNotifications,
    unreadBookingCount,
    setUnreadBookingCount,
    fetchBookingNotifications,
    markBookingNotificationAsRead,
    markAllBookingNotificationsAsRead,
  };

  return (
    <ShareContext.Provider value={value}>
      {props.children}
    </ShareContext.Provider>
  );
};

export default AppContextProvider;
