import plumbingServiceSchema from "../models/plumbingServiceSchema.js";
import ratingSchema from "../models/ratingSchema.js";

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
      const searchRegex = new RegExp(req.query.search, "i");
      query.$or = [
        { serviceName: searchRegex },
        { category: searchRegex },
        { serviceProviderName: searchRegex },
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
      .select(
        "category serviceName amount image serviceProviderName serviceProvider",
      );

    // Fetch ratings for each provider
    const serviceWithRatings = await Promise.all(
      services.map(async (service) => {
        const ratings = await ratingSchema.find({
          provider: service.serviceProvider?._id,
        });
        const avgRating =
          ratings.length > 0
            ? (
                ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
              ).toFixed(1)
            : 0;
        const totalReviews = ratings.length;

        return {
          _id: service._id,
          category: service.category,
          serviceName: service.serviceName,
          amount: service.amount,
          status: service.status,
          dateAdded: service.dateAdded,
          image: service.image,
          serviceProviderName: service.serviceProviderName,
          rating: parseFloat(avgRating),
          totalReviews: totalReviews,
          serviceProvider: {
            _id: service.serviceProvider?._id,
            name: service.serviceProvider?.name,
            email: service.serviceProvider?.email,
            bio: service.serviceProvider?.bio,
            image: service.serviceProvider?.image,
          },
        };
      }),
    );

    // Format the response
    const formattedServices = serviceWithRatings;

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
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch services" });
  }
};
