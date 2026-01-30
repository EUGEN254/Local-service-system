import Category from "../models/categorySchema.js";
import plumbingServiceSchema from "../models/plumbingServiceSchema.js";
import ratingSchema from "../models/ratingSchema.js";

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching categories", error });
  }
};

const getAllServices = async (req, res) => {
  try {
    const services = await plumbingServiceSchema.find()
      .populate('serviceProvider', '_id rating');
    
    // Fetch ratings for each service's provider
    const servicesWithRatings = await Promise.all(
      services.map(async (service) => {
        const ratings = await ratingSchema.find({ provider: service.serviceProvider?._id });
        const avgRating = ratings.length > 0
          ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
          : 0;

        return {
          ...service.toObject(),
          rating: parseFloat(avgRating),
          totalReviews: ratings.length
        };
      })
    );

    res.status(200).json({ success: true, data: servicesWithRatings });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching services", error });
  }
};

const getServiceProviderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Find service and populate service provider details
    const serviceWithProvider = await plumbingServiceSchema.findById(id)
      .populate('serviceProvider', '-password -serviceProviderInfo.idVerification.idFrontImage -serviceProviderInfo.idVerification.idBackImage -serviceProviderInfo.idVerification.idNumber');

    if (!serviceWithProvider) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (!serviceWithProvider.serviceProvider) {
      return res.status(404).json({
        success: false,
        message: "Service provider not found for this service",
      });
    }

    // Fetch ratings for this provider
    const ratings = await ratingSchema.find({ provider: serviceWithProvider.serviceProvider._id })
      .populate('user', 'name image')
      .sort({ createdAt: -1 })
      .limit(10); // Limit to 10 most recent ratings

    // Calculate average rating
    const avgRating = ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        service: {
          id: serviceWithProvider._id,
          serviceName: serviceWithProvider.serviceName,
          category: serviceWithProvider.category,
          amount: serviceWithProvider.amount,
          status: serviceWithProvider.status,
          image: serviceWithProvider.image,
          email: serviceWithProvider.email,
        },
        provider: serviceWithProvider.serviceProvider,
        ratings: {
          averageRating: parseFloat(avgRating),
          totalReviews: ratings.length,
          reviews: ratings.map(r => ({
            _id: r._id,
            rating: r.rating,
            comment: r.comment,
            userName: r.user?.name || 'Anonymous',
            userImage: r.user?.image,
            createdAt: r.createdAt,
          }))
        }
      },
    });
  } catch (error) {
    console.error("Error fetching service provider details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching service provider details",
      error: error.message,
    });
  }
};

export { getAllCategories, getAllServices, getServiceProviderDetails };
