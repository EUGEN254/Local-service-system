import axios from "axios";
import { API_BASE } from "../config/api.js";

/**
 * Admin Authentication Service
 * Handles admin login, logout, and verification
 */



export const loginAdmin = async (email, password, role = "admin") => {
  try {
    const { data } = await axios.post(
      `${API_BASE}/api/user/login-admin`,
      { email, password, role },
      { withCredentials: true },
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const logoutAdmin = async (navigate) => {
  try {
    // navigate to login immediately; do not touch localStorage here
    navigate("/", { replace: true });

    const { data } = await axios.post(
      `${API_BASE}/api/user/logoutAdmin`,
      {},
      { withCredentials: true },
    );
    
    if (data.success) {
      setTimeout(() => {
        // Toast will be shown from the hook
      }, 100);
    }
    return data;
  } catch (error) {
    // Ensure navigation even on error
    navigate("/", { replace: true });
    throw error.response?.data || error;
  }
};

export const getCurrentAdmin = async () => {
  try {
    const { data } = await axios.get(`${API_BASE}/api/user/me`, {
      withCredentials: true,
      validateStatus: (status) => status < 500,
    });
    return data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const verifyAdmin = async () => {
  try {
    const { data } = await axios.get(`${API_BASE}/api/user/me`, {
      withCredentials: true,
      validateStatus: (status) => status < 500,
    });

    return data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};
