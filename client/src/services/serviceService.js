import axios from "axios";
import { toast } from "react-toastify";

// Fetch user's services with pagination
export const fetchServices = async (
  backendUrl,
  page = 1,
  limit = 10
) => {
  try {
    const params = new URLSearchParams({
      page: page,
      limit: limit,
    });

    const { data } = await axios.get(
      `${backendUrl}/api/serviceprovider/my-services?${params.toString()}`,
      { withCredentials: true }
    );

    if (data.success) {
      return {
        services: data.services || [],
        pagination: data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalServices: 0,
          limit: limit,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
    return { services: [], pagination: {} };
  } catch (err) {
    console.error("Failed to load services:", err);
    toast.error("Failed to load services");
    throw err;
  }
};

// Add service to local list
export const addService = (services, service) => {
  return [service, ...services];
};

// Remove service from local list
export const removeService = (services, id) => {
  return services.filter((s) => s._id !== id);
};

// Fetch public/customer-facing services with pagination and optional filters
export const fetchPublicServices = async (
  backendUrl,
  page = 1,
  limit = 10,
  search = "",
  category = ""
) => {
  try {
    const params = new URLSearchParams({
      page: page,
      limit: limit,
    });

    if (search) params.append("search", search);
    if (category && category !== "All") params.append("category", category);

    const { data } = await axios.get(
      `${backendUrl}/api/customer/services?${params.toString()}`
    );

    if (data.success) {
      return {
        services: data.services || [],
        pagination: data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalServices: 0,
          limit: limit,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    return { services: [], pagination: {} };
  } catch (err) {
    console.error("Failed to load public services:", err);
    throw err;
  }
};
