import plumbingServiceSchema from "../models/plumbingServiceSchema.js";

// Fetch all services for customers
export const getServicesForCustomer = async (req, res) => {
  try {
    // Fetch all active services
    const services = await plumbingServiceSchema
      .find({ status: "Active" })
      .sort({ dateAdded: -1 })
      .select("category serviceName amount image serviceProviderName"); 

    res.status(200).json({ success: true, services });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch services" });
  }
};
