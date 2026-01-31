import { useState, useCallback } from "react";
import * as authService from "../services/authService";

/**
 * useAuth Hook
 * Manages authentication state and operations
 */
export const useAuth = (backendUrl, navigate) => {
  const [user, setUser] = useState(() => {
    const cachedUser = localStorage.getItem("user");
    return cachedUser ? JSON.parse(cachedUser) : null;
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [verified, setIsVerified] = useState(false);

  const fetchCurrentUser = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setAuthLoading(true);
        const userData = await authService.fetchCurrentUser(backendUrl);
        if (userData) {
          setUser(userData);
          const isUserVerified = authService.isUserVerified(userData);
          setIsVerified(isUserVerified);
        } else {
          setUser(null);
          setIsVerified(false);
        }
      } catch (err) {
        setUser(null);
        setIsVerified(false);
      } finally {
        if (showLoader) setTimeout(() => setAuthLoading(false), 150);
      }
    },
    [backendUrl]
  );

  const logoutUser = useCallback(
    async (socket) => {
      try {
        await authService.logoutUser(backendUrl, socket, navigate);
        setUser(null);
        setIsVerified(false);
      } catch (err) {
        console.error("Error logging out:", err);
        setUser(null);
        setIsVerified(false);
      }
    },
    [backendUrl, navigate]
  );

  return {
    user,
    setUser,
    authLoading,
    setAuthLoading,
    verified,
    setIsVerified,
    fetchCurrentUser,
    logoutUser,
  };
};
