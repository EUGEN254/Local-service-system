import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const ShareContext = createContext();

const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  const [services, setServices] = useState([]); // service provider services
  const [loadingServices, setLoadingServices] = useState(false);
  const currSymbol = 'KES'
  

  const cachedUser = localStorage.getItem("user");
  const [user, setUser] = useState(cachedUser ? JSON.parse(cachedUser) : null);
  const [authLoading, setAuthLoading] = useState(false);

  // 🔹 Fetch current user (optional loader)
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
      console.log("User not logged in:", err.message);
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    } finally {
      if (showLoader) setTimeout(() => setAuthLoading(false), 150);
    }
  };

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/serviceprovider/my-services`,
        {
          withCredentials: true,
        }
      );
      if (data.success) setServices(data.services);
    } catch (err) {
      toast.error("Failed to load services");
    } finally {
      setLoadingServices(false);
    }
  };

  const addService = (service) => {
    setServices((prev) => [service, ...prev]);
  };

  const removeService = (id) => {
    setServices((prev) => prev.filter((s) => s._id !== id));
  };

  // 🔹 Logout user
  const logoutUser = async () => {
    try {
      setAuthLoading(true);
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      navigate("/", { replace: true });
      setTimeout(() => toast.success("Logged out successfully"), 100);

      await axios.post(
        `${backendUrl}/api/user/logout`,
        {},
        {
          withCredentials: true,
        }
      );
    } catch (err) {
      console.log("Logout error:", err);
    } finally {
      setTimeout(() => setAuthLoading(false), 150);
    }
  };

  // 🔹 Verify session in background
  useEffect(() => {
    if (cachedUser) {
      fetchCurrentUser(false); // no visible loader
    } else {
      // If no cached user, still verify session silently, but no spinner
      fetchCurrentUser(false);
    }
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
    currSymbol
  };

  return (
    <ShareContext.Provider value={value}>
      {props.children}
    </ShareContext.Provider>
  );
};

export default AppContextProvider;
