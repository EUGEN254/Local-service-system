import { createContext, useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

export const ShareContext = createContext();

const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const currSymbol = "KES";

  const [unreadBySender, setUnreadBySender] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);

  const cachedUser = localStorage.getItem("user");
  const [user, setUser] = useState(cachedUser ? JSON.parse(cachedUser) : null);
  const [authLoading, setAuthLoading] = useState(false);

  const socket = useRef();

  // ---------------- SOCKET ----------------
  useEffect(() => {
    if (user) {
      socket.current = io(backendUrl, { withCredentials: true });

      // Join user room
      socket.current.emit("joinUserRoom", {
        userId: user._id,
        userName: user.name,
        userRole: user.role,
      });

      // Listen for online users
      socket.current.on("onlineUsers", (users) => {
        console.log("Online users updated:", users);
      });

      // Listen for new messages
      socket.current.on("receiveMessage", (message) => {
        if (message.receiver === user._id) {
          // Increment unread counts
          setUnreadBySender((prev) => {
            const newCount = (prev[message.sender] || 0) + 1;
            return { ...prev, [message.sender]: newCount };
          });

          setTotalUnread((prev) => prev + 1);
        }
      });

      return () => {
        socket.current.disconnect();
      };
    }
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
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("role", data.user.role);
      } else {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("role");
      }
    } catch (err) {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    } finally {
      if (showLoader) setTimeout(() => setAuthLoading(false), 150);
    }
  };

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

  // ---------------- LOGOUT ----------------
  const logoutUser = async () => {
    try {
      setAuthLoading(true);
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      socket.current?.disconnect();

      await axios.post(`${backendUrl}/api/user/logout`, {}, { withCredentials: true });
      navigate("/", { replace: true });
      setTimeout(() => toast.success("Logged out successfully"), 100);
    } catch (err) {
      console.log("Logout error:", err);
    } finally {
      setTimeout(() => setAuthLoading(false), 150);
    }
  };

  // ---------------- FETCH UNREAD COUNTS ----------------
  const fetchUnreadCounts = async () => {
    try {
      if (!user) return;
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

  useEffect(() => {
    if (user) fetchUnreadCounts();
  }, [user]);

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
    addService,
    removeService,
    currSymbol,
    socket,
    unreadBySender,
    totalUnread,
    fetchUnreadCounts,
  };

  return <ShareContext.Provider value={value}>{props.children}</ShareContext.Provider>;
};

export default AppContextProvider;
