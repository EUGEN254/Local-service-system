import axios from "axios";
import { API_BASE } from "../config/api.js";

/**
 * Admin Service Provider Management Service
 * Handles CRUD operations for service providers
 */



export const fetchServiceProviders = async () => {
  try {
    const { data } = await axios.get(
      `${API_BASE}/api/admin/service-providers`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateVerificationStatus = async (providerId, isVerified) => {
  try {
    const { data } = await axios.put(
      `${API_BASE}/api/admin/verify-provider/${providerId}`,
      { isVerified },
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateProviderProfile = async (providerId, formData) => {
  try {
    const { data } = await axios.put(
      `${API_BASE}/api/admin/update-provider/${providerId}`,
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

export const createProvider = async (formData) => {
  try {
    const { data } = await axios.post(
      `${API_BASE}/api/admin/create-provider`,
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

export const deleteProvider = async (providerId) => {
  try {
    const { data } = await axios.delete(
      `${API_BASE}/api/admin/delete-provider/${providerId}`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
