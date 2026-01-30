import { useState, useCallback } from "react";
import * as categoryService from "../services/categoryService";
import * as landingPageService from "../services/landingPageService";

/**
 * useCategories Hook
 * Manages categories state and operations
 */
export const useCategories = (backendUrl) => {
  const [categories, setCategories] = useState([]);
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!backendUrl) return;
    try {
      const data = await categoryService.fetchCategories(backendUrl);
      setCategories(data);
    } catch (error) {
      toast.error(error.message);
    }
  }, [backendUrl]);

  return {
    categories,
    setCategories,
    showCustomCategory,
    setShowCustomCategory,
    fetchCategories,
  };
};

/**
 * useLandingPage Hook
 * Manages landing page data state and operations
 */
export const useLandingPage = (backendUrl) => {
  const [landingCategories, setLandingCategories] = useState([]);
  const [landingServices, setLandingServices] = useState([]);
  const [loadingLandingData, setLoadingLandingData] = useState(false);

  const fetchLandingCategories = useCallback(async () => {
    if (!backendUrl) return;
    try {
      const data = await landingPageService.fetchLandingCategories(backendUrl);
      setLandingCategories(data);
    } catch (error) {
      console.error("Error fetching landing categories:", error);
    }
  }, [backendUrl]);

  const fetchLandingServices = useCallback(async () => {
    if (!backendUrl) return;
    try {
      const data = await landingPageService.fetchLandingServices(backendUrl);
      setLandingServices(data);
    } catch (error) {
      console.error("Error fetching landing services:", error);
    }
  }, [backendUrl]);

  const fetchLandingData = useCallback(async () => {
    if (!backendUrl) return;
    setLoadingLandingData(true);
    try {
      const result = await landingPageService.fetchLandingData(backendUrl);
      setLandingCategories(result.categories);
      setLandingServices(result.services);
    } catch (error) {
      console.error("Error fetching landing data:", error);
    } finally {
      setLoadingLandingData(false);
    }
  }, [backendUrl]);

  return {
    landingCategories,
    setLandingCategories,
    landingServices,
    setLandingServices,
    loadingLandingData,
    setLoadingLandingData,
    fetchLandingCategories,
    fetchLandingServices,
    fetchLandingData,
  };
};
