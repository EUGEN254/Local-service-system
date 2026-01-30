import axios from "axios";

/**
 * Admin User Management Service
 * Handles CRUD operations for customers and users
 */

const API_BASE = import.meta.env.VITE_BACKEND_URL;

export const fetchCustomers = async () => {
  try {
    const { data } = await axios.get(
      `${API_BASE}/api/admin/customers`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const fetchAdmins = async () => {
  try {
    const { data } = await axios.get(
      `${API_BASE}/api/admin/admins`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateUserStatus = async (userId, status) => {
  try {
    const { data } = await axios.put(
      `${API_BASE}/api/admin/update-user-status`,
      { userId, status },
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateUser = async (userId, formData) => {
  try {
    const { data } = await axios.put(
      `${API_BASE}/api/admin/update-user/${userId}`,
      formData,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createUser = async (formData) => {
  try {
    const { data } = await axios.post(
      `${API_BASE}/api/admin/create-user`,
      formData,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const { data } = await axios.delete(
      `${API_BASE}/api/admin/delete-user/${userId}`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
