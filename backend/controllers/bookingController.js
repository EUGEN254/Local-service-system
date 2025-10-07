import Booking from "../models/bookingSchema.js";


// Create a new booking (after payment or cash selection)
export const createBooking = async (req, res) => {
    try {
      console.log("📥 Received booking data:", req.body);
      const { 
        serviceId, 
        serviceName, 
        categoryName, 
        servicerProvider, 
        amount, 
        address, 
        city, 
        delivery_date, 
        paymentMethod 
      } = req.body;
  
      const customerId = req.user._id; 
  
      const isPaid = paymentMethod.toLowerCase() === "mpesa"; 
  
      const booking = await Booking.create({
        customer: customerId,
        serviceId,
        serviceName,
        categoryName,
        providerName: servicerProvider,
        amount,
        address,
        city,
        delivery_date,
        is_paid: isPaid,
        paymentMethod,
      });
  
      res.status(201).json({ success: true, booking });
    } catch (error) {
      console.error("❌ Create booking error:", error);
      res.status(500).json({ success: false, message: "Failed to create booking", error });
    }
  };
  

// Get all bookings for current user
export const getUserBookings = async (req, res) => {
  try {
    const customerId = req.user._id;
    const bookings = await Booking.find({ customer: customerId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch bookings", error });
  }
};
// Update payment status (after M-Pesa callback or confirmation)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { bookingId, is_paid } = req.body;
    const booking = await Booking.findByIdAndUpdate(bookingId, { is_paid }, { new: true });
    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update payment status", error });
  }
};


export const updateFailedBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        is_paid: req.body.is_paid,
        status: req.body.status || (req.body.is_paid ? "Waiting for Work" : "Payment Failed"),
      },
      { new: true }
    );
    res.json({ success: true, booking });
  } catch (err) {
    console.error("Error updating booking:", err);
    res.status(500).json({ success: false, message: "Failed to update booking" });
  }
};