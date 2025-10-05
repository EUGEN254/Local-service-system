import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const ShareContext = createContext();

const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);

  // 🔹 Fetch current user
  const fetchCurrentUser = async () => {
    try {
      setAuthLoading(true);
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
      setTimeout(() => setAuthLoading(false), 150);
    }
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

      await axios.post(`${backendUrl}/api/user/logout`, {}, {
        withCredentials: true,
      });
    } catch (err) {
      console.log("Logout error:", err);
    } finally {
      setTimeout(() => setAuthLoading(false), 150);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const value = {
    backendUrl,
    user,
    setUser,
    fetchCurrentUser,
    logoutUser,
    authLoading,
    setAuthLoading,
  };

  return (
    <ShareContext.Provider value={value}>
      {props.children}
    </ShareContext.Provider>
  );
};

export default AppContextProvider;
