import axios from "axios";
import { toast } from "react-toastify";

// Fetch all categories
export const fetchCategories = async (backendUrl) => {
  try {
    const { data } = await axios.get(`${backendUrl}/api/categories`, {
      withCredentials: true,
    });
    return data.success ? data.categories : [];
  } catch (err) {
    console.error("Failed to fetch categories:", err);
    toast.error("Failed to load categories");
    throw err;
  }
};
