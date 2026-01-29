import Category from "../models/categorySchema.js";
import plumbingServiceSchema from "../models/plumbingServiceSchema.js";
import User from "../models/userSchema.js";

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
    const services = await plumbingServiceSchema.find();
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching services", error });
  }
};

const getServiceProviderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Exclude sensitive fields using select
    const serviceProvider = await User.findById(id).select(
      "-password -serviceProviderInfo.idVerification.idFrontImage -serviceProviderInfo.idVerification.idBackImage -serviceProviderInfo.idVerification.idNumber",
    );

    if (!serviceProvider) {
      return res.status(404).json({
        success: false,
        message: "Service provider not found",
      });
    }

    res.status(200).json({
      success: true,
      data: serviceProvider,
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
