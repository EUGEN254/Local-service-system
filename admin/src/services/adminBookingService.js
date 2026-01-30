import axios from "axios";

/**
 * Admin Booking Management Service
 * Handles CRUD operations for bookings and transactions
 */

const API_BASE = import.meta.env.VITE_BACKEND_URL;

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
      `${API_BASE}/api/admin/update-booking/${bookingId}`,
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
      `${API_BASE}/api/admin/booking-stats`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
