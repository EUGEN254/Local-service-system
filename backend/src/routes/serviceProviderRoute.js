// routes/serviceRoutes.js
import express from "express";
import {
  upload,
  getServiceProviderName,
  userAuth,
} from "../middleware/index.js";
import {
  addService,
  getMyServices,
  deleteService,
  editService,
  getServiceDetails,
  getProviderBookings,
  getCustomerDetails,
  updateStatus,
  updateProfile,
  getAllServiceProviders,
  submitRating,
  getProviderRatings,
  updatePassword,
  updatePasswordGoogle,
} from "../controllers/serviceProviderControllers.js";

const serviceRouter = express.Router();

serviceRouter.post(
  "/add-service",
  userAuth,
  getServiceProviderName,
  upload.single("image"),
  addService,
);
serviceRouter.get("/my-services", userAuth, getMyServices);
serviceRouter.delete("/delete/:id", userAuth, deleteService);
serviceRouter.get("/mybookings", userAuth, getProviderBookings);
serviceRouter.put(
  "/update-profile",
  userAuth,
  upload.single("image"),
  updateProfile,
);
serviceRouter.put("/set-password", userAuth, updatePasswordGoogle);

serviceRouter.put("/update-password", userAuth, updatePassword);
serviceRouter.get("/customer/:customerId", userAuth, getCustomerDetails);
serviceRouter.get("/details/:serviceId", getServiceDetails);
serviceRouter.put("/edit/:id", userAuth, upload.single("image"), editService);
serviceRouter.put("/booking/:id/status", userAuth, updateStatus);
serviceRouter.get("/all", getAllServiceProviders);
// Ratings
serviceRouter.post("/:id/rate", userAuth, submitRating);
serviceRouter.get("/:id/ratings", getProviderRatings);

export default serviceRouter;
