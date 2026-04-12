import { useState, useCallback } from "react";
import { toast } from "sonner";
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

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchCustomers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await adminUserService.fetchCustomers();
      if (data.success) {
        setCustomers(data.customers || []);
      } else {
        toast.error(data.message || "Failed to load customers.");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Could not fetch customers. Please try again.");
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
      } else {
        toast.error(data.message || "Failed to load administrators.");
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Could not fetch administrators. Please try again.");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // ── Status toggle ────────────────────────────────────────────────────────

  const updateUserStatus = useCallback(async (userId, status) => {
    try {
      const data = await adminUserService.updateUserStatus(userId, status);
      if (data.success) {
        setCustomers((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, status } : user,
          ),
        );
        setAdmins((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, status } : user,
          ),
        );
        toast.success(
          `User ${status === "active" ? "activated" : "deactivated"} successfully.`,
        );
      } else {
        toast.error(data.message || "Failed to update user status.");
      }
      return data;
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error(
        error?.message || "Could not update user status. Please try again.",
      );
      throw error;
    }
  }, []);

  // ── Update user ──────────────────────────────────────────────────────────

  const updateUser = useCallback(async (userId, formData) => {
    setUpdatingUser(true);
    try {
      const data = await adminUserService.updateUser(userId, formData);
      if (data.success) {
        setCustomers((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, ...data.user } : user,
          ),
        );
        setAdmins((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, ...data.user } : user,
          ),
        );
        toast.success("User updated successfully.");
        return true;
      } else {
        toast.error(data.message || "Failed to update user.");
        return false;
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error?.message || "Could not update user. Please try again.");
      return false;
    } finally {
      setUpdatingUser(false);
    }
  }, []);

  // ── Create user ──────────────────────────────────────────────────────────
  const createUser = useCallback(async (formData) => {
    setAddingUser(true);
    try {
      const data = await adminUserService.createUser(formData);
      console.log("creating data", data);
      if (data.success) {
        const role = data.user.role;
        if (role === "customer") {
          setCustomers((prev) => [data.user, ...prev]);
        } else if (role === "admin" || role === "service-provider") {
          setAdmins((prev) => [data.user, ...prev]);
        }
        toast.success("User created successfully.");
        return true;
      } else {
        toast.error(data.message || "Failed to create user.");
        return false;
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error?.message || "Could not create user. Please try again.");
      return false;
    } finally {
      setAddingUser(false);
    }
  }, []);

  // ── Delete user ──────────────────────────────────────────────────────────

  const deleteUser = useCallback(async (userId) => {
    try {
      const data = await adminUserService.deleteUser(userId);
      if (data.success) {
        setCustomers((prev) => prev.filter((user) => user._id !== userId));
        setAdmins((prev) => prev.filter((user) => user._id !== userId));
        toast.success("User deleted successfully.");
        return true;
      } else {
        toast.error(data.message || "Failed to delete user.");
        return false;
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error?.message || "Could not delete user. Please try again.");
      return false;
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
