import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";

export const ShareContext = createContext();

const AppContextProvider = (props) => {
  // 1) App-level config and navigation helpers.
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  const currSymbol = "KES";

  // 2) Authentication state and actions.
  const authState = useAuth(backendUrl, navigate);
  const { user, authLoading, verified, fetchCurrentUser, logoutUser } =
    authState;

  // 3) Chat/notification state and actions from custom hook.
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

  // 4) Local reactive UI state.
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState({});

  // 5) Mutable refs used by socket callbacks without forcing re-renders.
  const socket = useRef(null);
  const activeRoomIdRef = useRef(null);

  const setActiveRoomId = (roomId) => {
    activeRoomIdRef.current = roomId;
  };

  const isServiceProvider = useCallback((currentUser) => {
    return (
      currentUser &&
      (currentUser.role === "serviceprovider" ||
        currentUser.role === "service-provider")
    );
  }, []);

  // Verify user session once on app boot.
  useEffect(() => {
    fetchCurrentUser(false);
  }, [fetchCurrentUser]);

  // Create and maintain socket connection after user is available.
  useEffect(() => {
    if (!user) return;

    // If socket exists but is disconnected, reset it before reconnecting.
    if (socket.current && !socket.current.connected) {
      socket.current.removeAllListeners();
      socket.current.disconnect();
      socket.current = null;
    }

    // Avoid duplicate connections.
    if (socket.current?.connected) return;

    socket.current = io(backendUrl, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ["websocket", "polling"],
    });

    socket.current.on("connect", () => {
      socket.current.emit("joinUserRoom", { userId: user._id });
    });

    socket.current.on("reconnect", () => {
      socket.current.emit("joinUserRoom", { userId: user._id });
    });

    socket.current.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        socket.current.connect();
      }
    });

    socket.current.on("onlineUsers", (users) => {
      setOnlineUsers(users.map((id) => id.toString()));
    });

    socket.current.on("receiveMessage", (message) => {
      if (message.receiver !== user._id) return;

      // If user is not viewing this room, count as unread and notify.
      if (activeRoomIdRef.current !== message.roomId) {
        setUnreadBySender((prev) => ({
          ...prev,
          [message.sender]: (prev[message.sender] || 0) + 1,
        }));
        setTotalUnread((prev) => prev + 1);
        toast.info("New message received");
      }
    });

    socket.current.on("newBooking", (bookingData) => {
      const shouldReceiveNotification =
        isServiceProvider(user) &&
        user.name?.trim().toLowerCase() ===
          bookingData.providerName?.trim().toLowerCase();

      if (!shouldReceiveNotification) return;

      setBookingNotifications((prev) => [bookingData, ...prev]);
      setUnreadBookingCount((prev) => prev + 1);
      toast.info(
        `New booking: ${bookingData.serviceName} from ${bookingData.customerName}`,
      );
    });

    return () => {
      if (socket.current) {
        socket.current.removeAllListeners();
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [
    user,
    backendUrl,
    isServiceProvider,
    setUnreadBySender,
    setTotalUnread,
    setBookingNotifications,
    setUnreadBookingCount,
  ]);

  // Keep unread chat counts fresh while user is logged in.
  useEffect(() => {
    if (!user) return;

    fetchUnreadCounts();
    const chatInterval = setInterval(fetchUnreadCounts, 10000);

    return () => clearInterval(chatInterval);
  }, [user, fetchUnreadCounts]);

  // Poll booking notifications only for service providers.
  useEffect(() => {
    if (!isServiceProvider(user)) return;

    fetchBookingNotifications();
    const bookingInterval = setInterval(fetchBookingNotifications, 30000);

    return () => clearInterval(bookingInterval);
  }, [user, isServiceProvider, fetchBookingNotifications]);

  // Shared context object consumed by app components.
  const value = {
    backendUrl,
    currSymbol,
    user,
    authLoading,
    verified,
    fetchCurrentUser,
    logoutUser,
    socket,
    onlineUsers,
    messages,
    setMessages,
    activeRoomId: activeRoomIdRef.current,
    setActiveRoomId,
    unreadBySender,
    setUnreadBySender,
    totalUnread,
    setTotalUnread,
    fetchUnreadCounts,
    markChatAsRead,
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
