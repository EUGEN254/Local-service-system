import { useState, useCallback, useEffect } from "react";
import * as adminUserService from "../services/adminUserService";

/**
 * useAdminUsers Hook
 * Manages user data state and operations
 */
export const useAdminUsers = () => {
  const [customers, setCustomers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [addingUser, setAddingUser] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await adminUserService.fetchCustomers();
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchAdmins = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await adminUserService.fetchAdmins();
      if (data.success) {
        setAdmins(data.admins || []);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const updateUserStatus = useCallback(async (userId, status) => {
    try {
      const data = await adminUserService.updateUserStatus(userId, status);
      if (data.success) {
        setCustomers((prev) =>
          prev.map((user) => (user._id === userId ? { ...user, status } : user))
        );
        setAdmins((prev) =>
          prev.map((user) => (user._id === userId ? { ...user, status } : user))
        );
      }
      return data;
    } catch (error) {
      console.error("Error updating user status:", error);
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (userId, formData) => {
    setUpdatingUser(true);
    try {
      const data = await adminUserService.updateUser(userId, formData);
      if (data.success) {
        setCustomers((prev) =>
          prev.map((user) => (user._id === userId ? { ...user, ...data.user } : user))
        );
        setAdmins((prev) =>
          prev.map((user) => (user._id === userId ? { ...user, ...data.user } : user))
        );
      }
      return data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    } finally {
      setUpdatingUser(false);
    }
  }, []);

  const createUser = useCallback(async (formData) => {
    setAddingUser(true);
    try {
      const data = await adminUserService.createUser(formData);
      if (data.success) {
        if (data.user.role === "customer") {
          setCustomers((prev) => [data.user, ...prev]);
        } else if (data.user.role === "admin") {
          setAdmins((prev) => [data.user, ...prev]);
        }
      }
      return data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    } finally {
      setAddingUser(false);
    }
  }, []);

  const deleteUser = useCallback(async (userId) => {
    try {
      const data = await adminUserService.deleteUser(userId);
      if (data.success) {
        setCustomers((prev) => prev.filter((user) => user._id !== userId));
        setAdmins((prev) => prev.filter((user) => user._id !== userId));
      }
      return data;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }, []);

  return {
    customers,
    admins,
    loadingUsers,
    updatingUser,
    addingUser,
    fetchCustomers,
    fetchAdmins,
    updateUserStatus,
    updateUser,
    createUser,
    deleteUser,
  };
};
