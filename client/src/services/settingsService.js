import axios from "axios";

// Fetch current service-provider profile
export const fetchProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    const { data } = await axios.get("/api/serviceprovider/me", {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  } catch (err) {
    console.error("Failed to fetch profile:", err);
    throw err;
  }
};

// Update profile (accepts FormData)
export const updateProfile = async (formData) => {
  try {
    const token = localStorage.getItem("token");
    const { data } = await axios.put("/api/serviceprovider/update-profile", formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return data;
  } catch (err) {
    console.error("Failed to update profile:", err);
    throw err;
  }
};
