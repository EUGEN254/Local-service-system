import axios from "axios";

// Create a booking (customer-facing)
export const createBooking = async (backendUrl, bookingPayload) => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/customer/create`,
      bookingPayload,
      { withCredentials: true }
    );
    return data;
  } catch (err) {
    console.error("Failed to create booking:", err);
    throw err;
  }
};

// Update booking status
export const updateBookingStatus = async (backendUrl, bookingId, payload) => {
  try {
    const { data } = await axios.put(
      `${backendUrl}/api/customer/update-booking-status/${bookingId}`,
      payload,
      { withCredentials: true }
    );
    return data;
  } catch (err) {
    console.error("Failed to update booking status:", err);
    throw err;
  }
};

// Fetch customer's bookings with pagination and filters
export const fetchMyBookings = async (
  backendUrl,
  { page = 1, limit = 10, search = "", paymentStatus = "all", dateTo = "", sort = "date-desc" } = {},
  options = {}
) => {
  try {
    const params = new URLSearchParams({
      page,
      limit,
      sort,
    });

    if (search) params.append("search", search);
    if (paymentStatus && paymentStatus !== "all") params.append("paymentStatus", paymentStatus);
    if (dateTo) params.append("dateTo", dateTo);

    const url = `${backendUrl}/api/customer/mybookings?${params.toString()}`;

    const axiosOptions = { withCredentials: true };
    if (options.signal) axiosOptions.signal = options.signal;

    const { data } = await axios.get(url, axiosOptions);
    return data;
  } catch (err) {
    console.error("Failed to fetch bookings:", err);
    throw err;
  }
};

// Fetch service provider's bookings
export const fetchProviderBookings = async (
  backendUrl,
  { page = 1, limit = 10, search = "", paymentStatus = "all", dateTo = "", sort = "date-desc" } = {},
  options = {}
) => {
  try {
    const params = new URLSearchParams({
      page,
      limit,
      sort,
    });

    if (search) params.append("search", search);
    if (paymentStatus && paymentStatus !== "all") params.append("paymentStatus", paymentStatus);
    if (dateTo) params.append("dateTo", dateTo);

    const url = `${backendUrl}/api/serviceprovider/mybookings?${params.toString()}`;

    const axiosOptions = { withCredentials: true };
    if (options.signal) axiosOptions.signal = options.signal;

    const { data } = await axios.get(url, axiosOptions);
    return data;
  } catch (err) {
    console.error("Failed to fetch provider bookings:", err);
    throw err;
  }
};

