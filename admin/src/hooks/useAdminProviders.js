import { useState, useCallback } from "react";
import * as adminProviderService from "../services/adminProviderService";

/**
 * useAdminProviders Hook
 * Manages service provider data state and operations
 */
export const useAdminProviders = () => {
  const [serviceProviders, setServiceProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [updatingProvider, setUpdatingProvider] = useState(false);
  const [addingProvider, setAddingProvider] = useState(false);

  const fetchServiceProviders = useCallback(async () => {
    setLoadingProviders(true);
    try {
      const data = await adminProviderService.fetchServiceProviders();

      if (data.success) {
        setServiceProviders(data.serviceProviders || []);
      }
    } catch (error) {
      console.error("Error fetching service providers:", error);
    } finally {
      setLoadingProviders(false);
    }
  }, []);

  const updateVerificationStatus = useCallback(async (providerId, isVerified) => {
    setUpdatingProvider(true);
    try {
      const data = await adminProviderService.updateVerificationStatus(providerId, isVerified);
      if (data.success) {
        setServiceProviders((prev) =>
          prev.map((provider) =>
            provider._id === providerId ? { ...provider, isVerified } : provider
          )
        );
      }
      return data;
    } catch (error) {
      console.error("Error updating verification status:", error);
      throw error;
    } finally {
      setUpdatingProvider(false);
    }
  }, []);

  const updateProviderProfile = useCallback(async (providerId, formData) => {
    setUpdatingProvider(true);
    try {
      const data = await adminProviderService.updateProviderProfile(providerId, formData);
      if (data.success) {
        setServiceProviders((prev) =>
          prev.map((provider) =>
            provider._id === providerId ? { ...provider, ...data.user } : provider
          )
        );
      }
      return data;
    } catch (error) {
      console.error("Error updating provider profile:", error);
      throw error;
    } finally {
      setUpdatingProvider(false);
    }
  }, []);

  const createProvider = useCallback(async (formData) => {
    setAddingProvider(true);
    try {
      const data = await adminProviderService.createProvider(formData);
      if (data.success) {
        setServiceProviders((prev) => [data.user, ...prev]);
      }
      return data;
    } catch (error) {
      console.error("Error creating provider:", error);
      throw error;
    } finally {
      setAddingProvider(false);
    }
  }, []);

  const deleteProvider = useCallback(async (providerId) => {
    try {
      const data = await adminProviderService.deleteProvider(providerId);
      if (data.success) {
        setServiceProviders((prev) =>
          prev.filter((provider) => provider._id !== providerId)
        );
      }
      return data;
    } catch (error) {
      console.error("Error deleting provider:", error);
      throw error;
    }
  }, []);

  const refreshProviders = useCallback(async () => {
    await fetchServiceProviders();
  }, [fetchServiceProviders]);

  return {
    serviceProviders,
    loadingProviders,
    updatingProvider,
    addingProvider,
    fetchServiceProviders,
    updateVerificationStatus,
    updateProviderProfile,
    createProvider,
    deleteProvider,
    refreshProviders,
  };
};
