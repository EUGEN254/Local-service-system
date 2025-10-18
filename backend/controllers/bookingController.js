import Booking from "../models/bookingSchema.js";
import plumbingServiceSchema from "../models/plumbingServiceSchema.js";
import User from "../models/userSchema.js";
import { io } from "../server.js";
import { createNotification } from "./notificationController.js";


// Create a new booking (after payment or cash selection)
export const createBooking = async (req, res) => {
  try {
    const { 
      serviceId, 
      serviceName, 
      categoryName, 
      serviceProvider, 
      amount, 
      address, 
      city, 
      phone,
      delivery_date, 
      paymentMethod,
      isPaid
    } = req.body;

    const customerId = req.user._id; 

    const booking = await Booking.create({
      customer: customerId,
      serviceId,
      serviceName,
      categoryName,
      providerName: serviceProvider, 
      amount,
      address,
      city,
      phone,
      delivery_date,
      is_paid: isPaid,
      paymentMethod,
      read: false,
    });

    // ✅ Populate customer details for socket emission
    const populatedBooking = await Booking.findById(booking._id)
      .populate('customer', 'name email');

    // ✅ Create notification for CUSTOMER
    await createNotification(customerId, {
      title: "Booking Confirmed!",
      message: `Your booking for ${serviceName} has been confirmed. ${isPaid ? 'Payment received.' : 'Please complete payment.'}`,
      type: "booking",
      category: "Booking",
      relatedEntity: booking._id,
      relatedEntityModel: "Booking",
      priority: "high"
    });

    // ✅ Create notification for SERVICE PROVIDER
    // Find the service provider user by name
    const providerUser = await User.findOne({ 
      name: serviceProvider,
      role: "service-provider" 
    });

    

    if (providerUser) {
      await createNotification(providerUser._id, {
        title: "New Booking Received! 🎉",
        message: `You have a new booking for ${serviceName} from ${populatedBooking.customer?.name || 'a customer'}. Amount: KSh ${amount} ${booking.phone}`,
        type: "booking",
        category: "Booking",
        relatedEntity: booking._id,
        relatedEntityModel: "Booking",
        priority: "high"
      });
    } else {
      return res.json({success:false,message:`⚠️ Service provider not found: ${serviceProvider}`})
    }

    // ✅ Create notification for ADMIN (optional - if you want admins to see all bookings)
    const adminUsers = await User.find({ role: "admin" });
    for (const admin of adminUsers) {
      await createNotification(admin._id, {
        title: "New Booking Created",
        message: `New booking for ${serviceName} by ${populatedBooking.customer?.name}. Provider: ${serviceProvider}`,
        type: "booking",
        category: "Booking",
        relatedEntity: booking._id,
        relatedEntityModel: "Booking",
        priority: "medium"
      });
    }

    // ✅ Emit socket event for real-time notification
    if (io) {
      const bookingData = {
        _id: populatedBooking._id,
        serviceName: populatedBooking.serviceName,
        categoryName: populatedBooking.categoryName,
        customerName: populatedBooking.customer?.name || 'Unknown Customer',
        customerEmail: populatedBooking.customer?.email || '',
        amount: populatedBooking.amount,
        address: populatedBooking.address,
        city: populatedBooking.city,
        delivery_date: populatedBooking.delivery_date,
        status: populatedBooking.status,
        is_paid: populatedBooking.is_paid,
        paymentMethod: populatedBooking.paymentMethod,
        read: false,
        createdAt: populatedBooking.createdAt,
        providerName: populatedBooking.providerName,  
        customerId: populatedBooking.customer?._id
      };

      // Emit the newBooking event
      io.emit("newBooking", bookingData);
    }

    res.status(201).json({ 
      success: true, 
      booking,
      message: "Booking created successfully with notifications sent"
    });
  } catch (error) {
    console.error("❌ Create booking error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create booking", 
      error: error.message 
    });
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

export const getServiceProviderDetails = async (req, res) => {
  try {
    const { serviceId } = req.params;
    
    // Find the service to get the serviceProvider ID
    const service = await plumbingServiceSchema.findById(serviceId);
    
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    // Get service provider details from User collection
    const serviceProvider = await User.findById(service.serviceProvider)
      .select('name email phone address bio image');

    if (!serviceProvider) {
      return res.status(404).json({ success: false, message: "Service provider not found" });
    }

    // Create response with both service and provider details
    const responseData = {
      service: service,
      serviceProvider: serviceProvider
    };

    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error("Get service provider details error:", error);
    res.status(500).json({ success: false, message: "Server error" });
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