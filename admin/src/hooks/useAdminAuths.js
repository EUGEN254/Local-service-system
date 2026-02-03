import { useNavigate } from "react-router-dom";
import * as adminAuthService from "../services/adminAuthService.js";
import { useState, useCallback } from "react";
import { toast } from "sonner";

/**
 * useAdminBookings Hook
 * Manages admin authenitcation
 */

export const useAdminAuths = () => {
  const [admin, setAdmin] = useState(null);
  const [verified, setIsVerified] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  const logoutAdmin = useCallback(async () => {
    try {
      setAdmin(null);
      setIsVerified(false);

      const data = await adminAuthService.logoutAdmin(navigate);

      if (data.success) {
        setTimeout(() => toast.success(data.message), 100);
      }
      return data;
    } catch (err) {
      console.error("Logout error:", err);
      // Even if backend call fails, user is already logged out locally
      setTimeout(() => toast.error("Logout error, but you have been signed out"), 100);
    }
  }, [navigate]);

  const fetchCurrentAdmin = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setAuthLoading(true);
      const data = await adminAuthService.getCurrentAdmin();

      if (data.success && data.user) {
        setAdmin(data.user);
        const isUserVerified = data.user.isVerified === true;
        setIsVerified(isUserVerified);
        // no localStorage writes on admin side; rely on in-memory state
      } else {
        setAdmin(null);
        setIsVerified(false);
        // no localStorage cleanup
      }
      return data;
    } catch (err) {
      console.error("Failed to fetch admin:", err);
      setAdmin(null);
      setIsVerified(false);
        // no localStorage cleanup
    } finally {
      if (showLoader) setAuthLoading(false);
    }
  }, []);

  const loginAdmin = useCallback(async (email, password, role) => {
    try {
      const data = await adminAuthService.loginAdmin(email, password, role);
      if (data.success && data.user) {
        if (data.user.role !== "admin") {
          toast.error("Access denied. Admin privileges required.");
          return;
        }
        // set in-memory admin state instead of localStorage
        setAdmin(data.user);
        setIsVerified(data.user.isVerified === true);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
      return data;
    } catch (error) {
      toast.error(error.message);
    }
  }, []);

  return {
    admin,
    setAdmin,
    fetchCurrentAdmin,
    logoutAdmin,
    loginAdmin,
    verified,
    authLoading,
  };
};
