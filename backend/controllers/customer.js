import plumbingServiceSchema from "../models/plumbingServiceSchema.js";

// Fetch all services for customers
export const getServicesForCustomer = async (req, res) => {
  try {
    // Fetch all active services and populate service provider details including bio
    const services = await plumbingServiceSchema
      .find({ status: "Active" })
      .sort({ dateAdded: -1 })
      .populate("serviceProvider", "name email bio image") // Populate with the fields you want
      .select("category serviceName amount image serviceProviderName serviceProvider"); 

    // Format the response to include bio
    const formattedServices = services.map(service => ({
      _id: service._id,
      category: service.category,
      serviceName: service.serviceName,
      amount: service.amount,
      status: service.status,
      dateAdded: service.dateAdded,
      image: service.image,
      serviceProviderName: service.serviceProviderName,
      serviceProvider: {
        _id: service.serviceProvider?._id,
        name: service.serviceProvider?.name,
        email: service.serviceProvider?.email,
        bio: service.serviceProvider?.bio,
        image: service.serviceProvider?.image
      }
    }));

    res.status(200).json({ success: true, services: formattedServices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch services" });
  }
};
