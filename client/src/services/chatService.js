import axios from "axios";

// Helper function to check if user is a service provider
const isServiceProvider = (user) => {
  return (
    user &&
    (user.role === "serviceprovider" || user.role === "service-provider")
  );
};

// Fetch unread chat counts
export const fetchUnreadCounts = async (backendUrl) => {
  try {
    const { data } = await axios.get(`${backendUrl}/api/chat/unread-count`, {
      withCredentials: true,
    });

    if (data.success) {
      const countsMap = {};
      let total = 0;

      data.unreadCounts.forEach((entry) => {
        countsMap[entry._id] = entry.count;
        total += entry.count;
      });

      return { countsMap, total };
    }
    return { countsMap: {}, total: 0 };
  } catch (err) {
    console.error("Failed to fetch unread counts:", err.message);
    throw err;
  }
};

// Fetch booking notifications (for service providers)
export const fetchBookingNotifications = async (backendUrl, user) => {
  if (!isServiceProvider(user)) return null;

  try {
    const { data } = await axios.get(
      `${backendUrl}/api/chat/booking-notifications`,
      {
        withCredentials: true,
      }
    );

    if (data.success) {
      return {
        notifications: data.notifications,
        unreadCount: data.unreadCount,
      };
    }
    return { notifications: [], unreadCount: 0 };
  } catch (err) {
    console.error("Failed to fetch booking notifications:", err);
    throw err;
  }
};

// Mark booking notification as read
export const markBookingNotificationAsRead = async (
  backendUrl,
  notificationId
) => {
  try {
    await axios.post(
      `${backendUrl}/api/chat/mark-notification-read`,
      { notificationId },
      { withCredentials: true }
    );
    return true;
  } catch (err) {
    console.error("Failed to mark notification as read:", err);
    throw err;
  }
};

// Mark all booking notifications as read
export const markAllBookingNotificationsAsRead = async (backendUrl) => {
  try {
    await axios.post(
      `${backendUrl}/api/chat/mark-all-notifications-read`,
      {},
      { withCredentials: true }
    );
    return true;
  } catch (err) {
    console.error("Failed to mark all notifications as read:", err);
    throw err;
  }
};

// Mark chat messages as read by sender
export const markChatAsRead = async (backendUrl, senderId) => {
  try {
    await axios.post(
      `${backendUrl}/api/chat/mark-read`,
      { senderId },
      { withCredentials: true }
    );
    return true;
  } catch (err) {
    console.error("Failed to mark messages as read:", err);
    throw err;
  }
};

// Fetch messages for a given user
export const fetchMessages = async (backendUrl, otherUserId) => {
  try {
    const { data } = await axios.get(
      `${backendUrl}/api/chat/messages/${otherUserId}`,
      { withCredentials: true }
    );
    return data;
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    throw err;
  }
};

// Send a text message
export const sendMessage = async (backendUrl, messagePayload) => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/chat/send`,
      messagePayload,
      { withCredentials: true }
    );
    return data;
  } catch (err) {
    console.error("Failed to send message:", err);
    throw err;
  }
};

// Send image message (multipart)
export const sendImage = async (backendUrl, formData) => {
  try {
    const { data } = await axios.post(`${backendUrl}/api/chat/send-image`, formData, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (err) {
    console.error("Failed to send image:", err);
    throw err;
  }
};

// Fetch my customers (service provider view)
export const fetchMyCustomers = async (backendUrl) => {
  try {
    const { data } = await axios.get(`${backendUrl}/api/chat/my-customers`, {
      withCredentials: true,
    });
    return data;
  } catch (err) {
    console.error("Failed to fetch my customers:", err);
    throw err;
  }
};

// Helper to check if user is service provider
export { isServiceProvider };
