import plumbingServiceSchema from "../models/plumbingServiceSchema.js";

// Fetch all services for customers
export const getServicesForCustomer = async (req, res) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;
    
    // Build query based on filters
    let query = { status: "Active" };
    
    // Search filter
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { serviceName: searchRegex },
        { category: searchRegex },
        { serviceProviderName: searchRegex }
      ];
    }
    
    // Category filter
    if (req.query.category && req.query.category !== "All") {
      query.category = req.query.category;
    }
    
    // Get total count
    const totalServices = await plumbingServiceSchema.countDocuments(query);
    
    // Fetch services with pagination
    const services = await plumbingServiceSchema
      .find(query)
      .sort({ dateAdded: -1 })
      .skip(skip)
      .limit(limit)
      .populate("serviceProvider", "name email bio image")
      .select("category serviceName amount image serviceProviderName serviceProvider");

    // Format the response
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

    // Calculate pagination info
    const totalPages = Math.ceil(totalServices / limit);
    
    res.status(200).json({ 
      success: true, 
      services: formattedServices,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalServices: totalServices,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch services" });
  }
};