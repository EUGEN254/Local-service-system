// routes/adminRoutes.js
import express from "express";
import userAuth from "../middleware/userAuth.js";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getServiceProviders,
  updateVerificationStatus,
  updateProviderProfile,
  createProvider,
  deleteProvider,
  getCustomers,
  getAdmins,
  updateUserStatus,
  updateUser,
  deleteUser,
  createUser
} from "../controllers/adminControllers.js";
import { getBookings, getBookingStats, getTransactions, updateBookingStatus } from "../controllers/adminBookingsController.js";

const adminRouter = express.Router();

// Service Provider Routes
adminRouter.get("/service-providers", userAuth, adminAuth, getServiceProviders);
adminRouter.put("/update-verification", userAuth, adminAuth, updateVerificationStatus);
adminRouter.put("/update-provider/:id", userAuth, adminAuth, upload.single("image"), updateProviderProfile);
adminRouter.post("/create-provider", userAuth, adminAuth, upload.single("image"), createProvider);
adminRouter.delete("/delete-provider/:id", userAuth, adminAuth, deleteProvider);

// User Management Routes
adminRouter.get("/customers", userAuth, adminAuth, getCustomers);
adminRouter.get("/admins", userAuth, adminAuth, getAdmins);
adminRouter.put("/update-user-status", userAuth, adminAuth, updateUserStatus);
adminRouter.put("/update-user/:id", userAuth, adminAuth, upload.single("image"), updateUser);
adminRouter.delete("/delete-user/:id", userAuth, adminAuth, deleteUser);
adminRouter.post("/create-user", userAuth, adminAuth, upload.single("image"), createUser);



adminRouter.get("/bookings",userAuth, adminAuth, getBookings);
adminRouter.get("/transactions",userAuth, adminAuth, getTransactions);
adminRouter.put("/bookings/:id/status",userAuth, adminAuth, updateBookingStatus);
adminRouter.get("/bookings-stats",userAuth, adminAuth, getBookingStats);

export default adminRouter;