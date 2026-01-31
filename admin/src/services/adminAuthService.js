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
      { withCredentials: true },
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
      { withCredentials: true },
    );
    return data;
  } catch (error) {
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
