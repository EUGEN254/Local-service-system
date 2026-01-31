import axios from "axios";
import { toast } from "sonner";

// Fetch current logged-in user
export const fetchCurrentUser = async (backendUrl) => {
  try {
    const { data } = await axios.get(`${backendUrl}/api/user/me`, {
      withCredentials: true,
    });

    if (data.success && data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.user.role);
      return data.user;
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      return null;
    }
  } catch (err) {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    throw err;
  }
};

// Logout user
export const logoutUser = async (backendUrl, socket, navigate) => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/user/logout`,
      {},
      { withCredentials: true }
    );

    localStorage.removeItem("user");
    localStorage.removeItem("role");
    socket?.current?.disconnect();

    if (data.success) {
      navigate("/", { replace: true });
      setTimeout(() => toast.success(data.message), 100);
    }
    return data;
  } catch (err) {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    socket?.current?.disconnect();
    navigate("/", { replace: true });
    throw err;
  }
};

// Check if user is verified
export const isUserVerified = (user) => {
  return user && user.isVerified === true;
};

// Register user
export const register = async (backendUrl, { name, email, password, termsAccepted, role }) => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/user/register`,
      { name, email, password, termsAccepted, role },
      { withCredentials: true }
    );
    return data;
  } catch (err) {
    console.error('Register error', err);
    throw err;
  }
};

// Login user
export const login = async (backendUrl, { email, password, role }) => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/user/login`,
      { email, password, role },
      { withCredentials: true, validateStatus: () => true }
    );
    return data;
  } catch (err) {
    console.error('Login error', err);
    throw err;
  }
};

// Google login
export const googleLogin = async (backendUrl, { token, role }) => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/user/google-login`,
      { token, role },
      { withCredentials: true }
    );
    return data;
  } catch (err) {
    console.error('Google login error', err);
    throw err;
  }
};
