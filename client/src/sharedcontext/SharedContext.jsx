import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";

export const ShareContext = createContext();

const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  const currSymbol = "KES";

  const authState = useAuth(backendUrl, navigate);
  const { user, authLoading, verified, fetchCurrentUser, logoutUser } = authState;

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

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState({});

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

  useEffect(() => {
    fetchCurrentUser(false);
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (!user) return;

    if (socket.current && !socket.current.connected) {
      socket.current.removeAllListeners();
      socket.current.disconnect();
      socket.current = null;
    }

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

    // ✅ Single centralized receiveMessage handler
    socket.current.on("receiveMessage", (message) => {
      // Only handle messages meant for this user
      if (message.receiver?.toString() !== user._id?.toString()) return;

  console.log("📩 receiveMessage in context | messageId:", message.messageId, "| roomId:", message.roomId);


      // Add to messages state with deduplication
      setMessages((prev) => {
        const roomMessages = prev[message.roomId] || [];
        if (roomMessages.some((m) => m.messageId === message.messageId)) {
          return prev;
        }
        return { ...prev, [message.roomId]: [...roomMessages, message] };
      });

      // If not currently viewing this room, increment unread count and notify
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

  useEffect(() => {
    if (!user) return;
    fetchUnreadCounts();
    const chatInterval = setInterval(fetchUnreadCounts, 10000);
    return () => clearInterval(chatInterval);
  }, [user, fetchUnreadCounts]);

  useEffect(() => {
    if (!isServiceProvider(user)) return;
    fetchBookingNotifications();
    const bookingInterval = setInterval(fetchBookingNotifications, 30000);
    return () => clearInterval(bookingInterval);
  }, [user, isServiceProvider, fetchBookingNotifications]);

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