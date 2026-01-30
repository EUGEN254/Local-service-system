import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import * as adminCategoryService from "../services/adminCategoryService";

/**
 * useAdminCategories Hook
 * Manages category data state and operations
 */
export const useAdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [updatingCategory, setUpdatingCategory] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const data = await adminCategoryService.fetchCategories();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error(error?.message || "Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const createCategory = useCallback(async (formData) => {
    setAddingCategory(true);
    try {
      const data = await adminCategoryService.createCategory(formData);
      if (data.success) {
        setCategories((prev) => [data.category, ...prev]);
        toast.success(data.message || "Category created successfully");
      }
      return data;
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error(error?.message || "Failed to create category");
      throw error;
    } finally {
      setAddingCategory(false);
    }
  }, []);

  const updateCategory = useCallback(async (categoryId, formData) => {
    setUpdatingCategory(true);
    try {
      const data = await adminCategoryService.updateCategory(categoryId, formData);
      if (data.success) {
        setCategories((prev) =>
          prev.map((cat) =>
            cat._id === categoryId ? { ...cat, ...data.category } : cat
          )
        );
        toast.success(data.message || "Category updated successfully");
      }
      return data;
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error(error?.message || "Failed to update category");
      throw error;
    } finally {
      setUpdatingCategory(false);
    }
  }, []);

  const deleteCategory = useCallback(async (categoryId) => {
    try {
      const data = await adminCategoryService.deleteCategory(categoryId);
      if (data.success) {
        setCategories((prev) =>
          prev.filter((cat) => cat._id !== categoryId)
        );
        toast.success(data.message || "Category deleted successfully");
      }
      return data;
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(error?.message || "Failed to delete category");
      throw error;
    }
  }, []);

  const toggleCategoryStatus = useCallback(async (categoryId, isActive) => {
    setUpdatingCategory(true);
    try {
      const data = await adminCategoryService.toggleCategoryStatus(categoryId, isActive);
      if (data.success) {
        setCategories((prev) =>
          prev.map((cat) =>
            cat._id === categoryId ? { ...cat, isActive } : cat
          )
        );
        toast.success(data.message || "Category status updated");
      }
      return data;
    } catch (error) {
      console.error("Error toggling category status:", error);
      toast.error(error?.message || "Failed to update category status");
      throw error;
    } finally {
      setUpdatingCategory(false);
    }
  }, []);

  return {
    categories,
    loadingCategories,
    updatingCategory,
    addingCategory,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
  };
};
