import axios from "axios";

export const fetchAllProviders = async (backendUrl, page, limit) => {
  try {
    const response = await axios.get(
      `${backendUrl}/api/serviceprovider/all?page=${page}&limit=${limit}`
    );
    if (response.data.success) {
      // Return the entire data object, not just providers
      return {
        success: response.data.success,
        providers: response.data.providers,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit
      };
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    throw error;
  }
};