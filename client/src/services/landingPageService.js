import axios from "axios";

// Fetch landing page categories
export const fetchLandingCategories = async (backendUrl) => {
  try {
    const { data } = await axios.get(
      `${backendUrl}/api/landingpage/categories`
    );
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Failed to fetch landing categories:", error);
    throw error;
  }
};

// Fetch landing page services
export const fetchLandingServices = async (backendUrl) => {
  try {
    const { data } = await axios.get(
      `${backendUrl}/api/landingpage/services`
    );
    console.log("Landing Services Data:", data);
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Failed to fetch landing services:", error);
    throw error;
  }
};

// Fetch all landing page data at once
export const fetchLandingData = async (backendUrl) => {
  try {
    const [categoriesResult, servicesResult] = await Promise.all([
      fetchLandingCategories(backendUrl),
      fetchLandingServices(backendUrl),
    ]);

    return {
      categories: categoriesResult,
      services: servicesResult,
    };
  } catch (error) {
    console.error("Failed to fetch landing page data:", error);
    throw error;
  }
};

// Fetch provider details by id
export const fetchProviderDetails = async (backendUrl, providerId) => {
  try {
    const { data } = await axios.get(
      `${backendUrl}/api/landingpage/serviceprovider/${providerId}`
    );
    console.log("Provider Details Data:", data);
    return data;
  } catch (error) {
    console.error("Failed to fetch provider details:", error);
    throw error;
  }
};

// Fetch customer details by id (for service providers)
export const fetchCustomerDetails = async (backendUrl, customerId) => {
  try {
    const { data } = await axios.get(
      `${backendUrl}/api/serviceprovider/customer/${customerId}`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    console.error("Failed to fetch customer details:", error);
    throw error;
  }
};
