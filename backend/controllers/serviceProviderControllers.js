import { v2 as cloudinary } from "cloudinary";
import plumbingServiceSchema from "../models/plumbingServiceSchema.js";

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
