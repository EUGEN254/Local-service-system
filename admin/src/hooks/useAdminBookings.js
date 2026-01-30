import { useState, useCallback } from "react";
import * as adminBookingService from "../services/adminBookingService";

/**
 * useAdminBookings Hook
 * Manages booking data state and operations
 */
export const useAdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingAllBookings, setLoadingAllBookings] = useState(false);
  const [updatingBooking, setUpdatingBooking] = useState(false);
  const [bookingStats, setBookingStats] = useState(null);

  const fetchAllBookings = useCallback(async () => {
    setLoadingAllBookings(true);
    try {
      const data = await adminBookingService.fetchAllBookings();
      if (data.success) {
        setAllBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Error fetching all bookings:", error);
    } finally {
      setLoadingAllBookings(false);
    }
  }, []);

  const fetchBookings = useCallback(async (filters = {}) => {
    setLoadingBookings(true);
    try {
      const data = await adminBookingService.fetchBookings(filters);
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  const updateBookingStatus = useCallback(async (bookingId, status) => {
    setUpdatingBooking(true);
    try {
      const data = await adminBookingService.updateBookingStatus(bookingId, status);
      if (data.success) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking._id === bookingId ? { ...booking, status } : booking
          )
        );
        setAllBookings((prev) =>
          prev.map((booking) =>
            booking._id === bookingId ? { ...booking, status } : booking
          )
        );
      }
      return data;
    } catch (error) {
      console.error("Error updating booking status:", error);
      throw error;
    } finally {
      setUpdatingBooking(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (filters = {}) => {
    setLoadingTransactions(true);
    try {
      const data = await adminBookingService.fetchTransactions(filters);
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  const fetchBookingStats = useCallback(async () => {
    try {
      const data = await adminBookingService.fetchBookingStats();
      if (data.success) {
        setBookingStats(data.stats);
      }
      return data;
    } catch (error) {
      console.error("Error fetching booking stats:", error);
      throw error;
    }
  }, []);

  return {
    bookings,
    allBookings,
    transactions,
    loadingBookings,
    loadingTransactions,
    loadingAllBookings,
    updatingBooking,
    bookingStats,
    fetchAllBookings,
    fetchBookings,
    updateBookingStatus,
    fetchTransactions,
    fetchBookingStats,
  };
};
