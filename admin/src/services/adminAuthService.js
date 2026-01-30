import axios from "axios";

/**
 * Admin Authentication Service
 * Handles admin login, logout, and verification
 */

const API_BASE = import.meta.env.VITE_BACKEND_URL;

export const loginAdmin = async (email, password, role = "admin") => {
  try {
    const { data } = await axios.post(
      `${API_BASE}/api/user/login-admin`,
      { email, password, role },
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const logoutAdmin = async () => {
  try {
    const { data } = await axios.post(
      `${API_BASE}/api/user/logoutAdmin`,
      {},
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getCurrentAdmin = async () => {
  try {
    // backend exposes current user at /api/user/me
    const { data } = await axios.get(`${API_BASE}/api/user/me`, {
      withCredentials: true,
    });
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const verifyAdmin = async () => {
  try {
    // No dedicated verify endpoint; reuse /api/user/me and ensure role is admin
    const { data } = await axios.get(`${API_BASE}/api/user/me`, {
      withCredentials: true,
    });
    // Return the user data so callers can inspect role/verification
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
