// src/sharedcontext/SharedContext.jsx
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const ShareContext = createContext();

const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  const [user, setUser] = useState(undefined); // Start as undefined for initial load
  const [authLoading, setAuthLoading] = useState(true);

  // Fetch current logged-in user
  const fetchCurrentUser = async () => {
    try {
      setAuthLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/user/me`, {
        withCredentials: true,
      });

      if (data.success) {
        setUser(data.user);
      } else {
        setUser(null); // Set to null when definitely not logged in
      }
    } catch (err) {
      console.error(err);
      setUser(null); // Set to null when definitely not logged in
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout function - IMPROVED VERSION
  const logoutUser = async () => {
    try {
      setUser(undefined);
      setAuthLoading(true); // Show loader during logout
      
      const { data } = await axios.post(
        `${backendUrl}/api/user/logout`,
        {},
        { withCredentials: true }
      );

      if (data.success) {
        toast.success(data.message);
        
        // Navigate first, then set final state
        navigate("/", { replace: true });
        
        // Small delay to ensure navigation completes before final state
        setTimeout(() => {
          setUser(null); // Final state - definitely logged out
          setAuthLoading(false);
        }, 100);
      } else {
        toast.error(data.message);
        // If logout failed, restore user state
        await fetchCurrentUser();
      }
    } catch (err) {
      console.error("❌ DEBUG - Logout error:", err);
      toast.error(err.response?.data?.message || "Logout failed");
      // If logout failed, restore user state
      await fetchCurrentUser();
    }
  };

  // Enhanced login helper function
  const loginUser = async (userData) => {
    setUser(userData);
    localStorage.setItem("role", userData.role);
  };

  // Clear user data (for edge cases)
  const clearUser = () => {
    setUser(null);
    localStorage.removeItem("role");
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return user !== null && user !== undefined;
  };

  // Get user role safely
  const getUserRole = () => {
    return user?.role || null;
  };

  // Load current user on mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const value = {
    backendUrl,
    user,
    authLoading,
    fetchCurrentUser,
    logoutUser,
    loginUser,
    clearUser,
    isAuthenticated,
    getUserRole,
  };

  return (
    <ShareContext.Provider value={value}>
      {props.children}
    </ShareContext.Provider>
  );
};

export default AppContextProvider;