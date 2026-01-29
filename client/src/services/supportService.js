import axios from "axios";

// Submit support ticket
export const submitSupportTicket = async (backendUrl, ticketData) => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/support/submit`,
      ticketData,
      { withCredentials: true }
    );
    return data;
  } catch (err) {
    console.error("Failed to submit support ticket:", err);
    throw err;
  }
};
