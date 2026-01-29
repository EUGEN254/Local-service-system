import axios from "axios";

// Initiate M-Pesa STK push
export const initiateMpesa = async (backendUrl, payload) => {
  try {
    const { data } = await axios.post(`${backendUrl}/api/mpesa/stkpush`, payload, {
      withCredentials: true,
    });
    return data;
  } catch (err) {
    console.error("Failed to initiate M-Pesa:", err);
    throw err;
  }
};

// Check M-Pesa payment status by CheckoutRequestID
export const checkMpesaStatus = async (backendUrl, checkoutRequestId) => {
  try {
    const { data } = await axios.get(`${backendUrl}/api/mpesa/status/${checkoutRequestId}`);
    return data;
  } catch (err) {
    console.error("Failed to check M-Pesa status:", err);
    throw err;
  }
};
