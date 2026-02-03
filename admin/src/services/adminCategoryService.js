import axios from "axios";
import { API_BASE } from "../config/api.js";

/**
 * Admin Category Management Service
 * Handles CRUD operations for service categories
 */



export const fetchCategories = async () => {
  try {
    const { data } = await axios.get(
      `${API_BASE}/api/categories`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createCategory = async (formData) => {
  try {
    const { data } = await axios.post(
      `${API_BASE}/api/categories`,
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

export const updateCategory = async (categoryId, formData) => {
  try {
    const { data } = await axios.put(
      `${API_BASE}/api/categories/${categoryId}`,
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

export const deleteCategory = async (categoryId) => {
  try {
    const { data } = await axios.delete(
      `${API_BASE}/api/categories/${categoryId}`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const toggleCategoryStatus = async (categoryId, isActive) => {
  try {
    const { data } = await axios.put(
      `${API_BASE}/api/categories/${categoryId}/toggle-status`,
      { isActive },
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
