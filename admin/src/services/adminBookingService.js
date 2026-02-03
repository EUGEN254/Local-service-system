import axios from "axios";
import { API_BASE } from "../config/api.js";

/**
 * Admin Booking Management Service
 * Handles CRUD operations for bookings and transactions
 */



export const fetchAllBookings = async () => {
  try {
    const { data } = await axios.get(
      `${API_BASE}/api/admin/bookings`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const fetchBookings = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const { data } = await axios.get(
      `${API_BASE}/api/admin/bookings?${params}`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateBookingStatus = async (bookingId, status) => {
  try {
    const { data } = await axios.put(
      `${API_BASE}/api/admin/bookings/${bookingId}/status`,
      { status },
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const fetchTransactions = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const { data } = await axios.get(
      `${API_BASE}/api/admin/transactions?${params}`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const fetchBookingStats = async () => {
  try {
    const { data } = await axios.get(
      `${API_BASE}/api/admin/bookings-stats`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markBookingAsRead = async (bookingId) => {
  try {
    const { data } = await axios.put(
      `${API_BASE}/api/admin/bookings/${bookingId}/mark-read`,
      {},
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markAllBookingsAsRead = async () => {
  try {
    const { data } = await axios.put(
      `${API_BASE}/api/admin/bookings/mark-all-read`,
      {},
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
