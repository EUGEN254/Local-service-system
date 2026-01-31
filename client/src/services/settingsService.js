import axios from "axios";

// Fetch current service-provider profile
export const fetchProfile = async (backendUrl) => {
  try {
    const token = localStorage.getItem("token");
    const { data } = await axios.get(backendUrl + "/api/serviceprovider/me", {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  } catch (err) {
    console.error("Failed to fetch profile:", err);
    throw err;
  }
};




export const updateProfile = async (backendUrl, formData) => {
  try {
    const { data } = await axios.put(
      `${backendUrl}/api/serviceprovider/update-profile`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      }
    );
    return data;
  } catch (err) {
    console.error("Error updating profile:", err);
    throw err;
  }
};

export const updatePassword = async (backendUrl, currentPassword, newPassword) => {
  try {
    const { data } = await axios.put(
      `${backendUrl}/api/serviceprovider/update-password`,
      {
        currentPassword,
        newPassword,
      },
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (err) {
    console.error("Error updating password:", err);
    throw err;
  }
};

export const setInitialPassword = async (backendUrl, newPassword) => {
  try {
    const { data } = await axios.put(
      `${backendUrl}/api/serviceprovider/set-password`,
      {
        newPassword,
      },
      {
        withCredentials: true,
      }
    );
    return data;
  } catch (err) {
    console.error("Error setting password:", err);
    throw err;
  }
};
