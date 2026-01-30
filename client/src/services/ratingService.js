import axios from 'axios';

export const rateProvider = async (backendUrl, providerId, rating, comment) => {
  try {
    const response = await axios.post(`${backendUrl}/api/serviceprovider/${providerId}/rate`, { rating, comment }, { withCredentials: true });
    return response.data;
  } catch (err) {
    throw err;
  }
};

export const fetchProviderRatings = async (backendUrl, providerId, page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${backendUrl}/api/serviceprovider/${providerId}/ratings?page=${page}&limit=${limit}`);
    return response.data;
  } catch (err) {
    throw err;
  }
};
