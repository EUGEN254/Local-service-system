import { useState, useCallback } from "react";
import * as serviceService from "../services/serviceService";

/**
 * useServices Hook
 * Manages user services state and operations
 */
export const useServices = (backendUrl) => {
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalServices: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchServices = useCallback(
    async (page = 1, limit = pagination.limit) => {
      if (!backendUrl) return;
      setLoadingServices(true);
      try {
        const result = await serviceService.fetchServices(
          backendUrl,
          page,
          limit
        );
        setServices(result.services);
        setPagination(result.pagination);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoadingServices(false);
      }
    },
    [backendUrl, pagination.limit]
  );

  const addService = useCallback((newService) => {
    setServices((prev) => serviceService.addService(prev, newService));
  }, []);

  const removeService = useCallback((id) => {
    setServices((prev) => serviceService.removeService(prev, id));
  }, []);

  return {
    services,
    setServices,
    loadingServices,
    setLoadingServices,
    pagination,
    setPagination,
    fetchServices,
    addService,
    removeService,
  };
};
