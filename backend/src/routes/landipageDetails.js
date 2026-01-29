import express from "express";
import {
  getAllCategories,
  getAllServices,
  getServiceProviderDetails,
} from "../controllers/landingPageController.js";

const landipageDetailsRouter = express.Router();

landipageDetailsRouter.get("/categories", getAllCategories);
landipageDetailsRouter.get("/services", getAllServices);
landipageDetailsRouter.get("/serviceprovider/:id", getServiceProviderDetails);

export default landipageDetailsRouter;
