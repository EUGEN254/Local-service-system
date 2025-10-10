import { v2 as cloudinary } from "cloudinary";
import plumbingServiceSchema from "../models/plumbingServiceSchema.js";
import Booking from "../models/bookingSchema.js";
import User from "../models/userSchema.js";
import mpesaTransactionsSchema from "../models/mpesaTransactionsSchema.js";

// Add a new service
export const addService = async (req, res) => {
  try {
    const { category, serviceName, amount, status } = req.body;
    const serviceProviderName = req.serviceProviderName;

    if (!category || !serviceName || !amount) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Service image is required" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, { folder: "services" });

    const newService = new plumbingServiceSchema({
      category,
      serviceName,
      amount,
      status: status || "Active",
      dateAdded: new Date(),
      image: result.secure_url,
      serviceProviderName,
      serviceProvider: req.user._id,
    });

    const savedService = await newService.save();
    res.status(201).json({ success: true, service: savedService });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all services for the logged-in service provider
export const getMyServices = async (req, res) => {
  try {
    const services = await plumbingServiceSchema
      .find({ serviceProvider: req.user._id })
      .sort({ dateAdded: -1 });

    res.json({ success: true, services });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch services" });
  }
};


export const getProviderBookings = async (req, res) => {
  try {
    const providerName = req.user.name; 
    const bookings = await Booking.find({ providerName })
      .populate("customer", "name email phone") 
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error("Fetch provider bookings error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch bookings", error });
  }
};





export const getCustomerDetails = async (req, res) => {
  try {
    const customerId = req.params.customerId;

    // Fetch customer from Users collection
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
 

    const latestTransaction = await mpesaTransactionsSchema.findOne({ customer: customer.name })
      .sort({ createdAt: -1 });


    const customerData = {
      name: customer.name,
      email: customer.email,
      phone: latestTransaction ? latestTransaction.phone : "N/A",
    };

    res.json({ success: true, customer: customerData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




export const getServiceDetails = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await plumbingServiceSchema.findById(serviceId);

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    res.status(200).json({ success: true, service });
  } catch (error) {
    console.error("Get service details error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete a service
export const deleteService = async (req, res) => {
    try {
      const { id } = req.params;
  
      const service = await plumbingServiceSchema.findById(id);
      if (!service) {
        return res.status(404).json({ success: false, message: "Service not found" });
      }
  
      if (!service.serviceProvider.equals(req.user._id)) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
  
      await service.deleteOne(); // <-- updated here
      res.json({ success: true, message: "Service deleted successfully", serviceId: id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Failed to delete service" });
    }
  };
  

// Edit a service
export const editService = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, serviceName, amount, status } = req.body;

    const service = await plumbingServiceSchema.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    if (!service.serviceProvider.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Update fields
    if (category) service.category = category;
    if (serviceName) service.serviceName = serviceName;
    if (amount) service.amount = amount;
    if (status) service.status = status;

    // Update image if a new file is uploaded
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: "services" });
      service.image = result.secure_url;
    }

    const updatedService = await service.save();
    res.json({ success: true, service: updatedService });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update service" });
  }
};


export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, bio, address } = req.body;

    // 🧩 Build the update object dynamically (only include provided fields)
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (bio) updateData.bio = bio;
    if (address) updateData.address = address;

    // 🖼️ Handle Cloudinary image upload (if a new image is sent)
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "service_providers",
      });
      updateData.image = result.secure_url;
    }

    // 🧠 Update only provided fields
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      select: "-password", // never send password back
    });

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "Service provider not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Service provider profile updated successfully!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating service provider profile:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
};
