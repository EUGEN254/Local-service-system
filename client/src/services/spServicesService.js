import axios from "axios";

// Add a new service
export const addService = async (backendUrl, formData) => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/serviceprovider/add-service`,
      formData,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  } catch (err) {
    console.error("Failed to add service:", err);
    throw err;
  }
};

// Update a service
export const updateService = async (backendUrl, serviceId, formData) => {
  try {
    const { data } = await axios.put(
      `${backendUrl}/api/serviceprovider/edit/${serviceId}`,
      formData,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  } catch (err) {
    console.error("Failed to update service:", err);
    throw err;
  }
};

// Delete a service
export const deleteService = async (backendUrl, serviceId) => {
  try {
    const { data } = await axios.delete(
      `${backendUrl}/api/serviceprovider/delete/${serviceId}`,
      { withCredentials: true }
    );
    return data;
  } catch (err) {
    console.error("Failed to delete service:", err);
    throw err;
  }
};

// Submit ID verification
export const submitIdVerification = async (backendUrl, formData) => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/user/submit-id-verification`,
      formData,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  } catch (err) {
    console.error("Failed to submit ID verification:", err);
    throw err;
  }
};
