// routes/adminRoutes.js
import express from "express";
import { userAuth, adminAuth, upload } from "../middleware/index.js";
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
  createUser,
  getAllBookings,
  updateProfile,
} from "../controllers/adminControllers.js";
import { getBookings, getBookingStats, getTransactions, updateBookingStatus, getUnreadBookingsCount, markBookingAsRead, markAllBookingsAsRead } from "../controllers/adminBookingsController.js";
import { getAdminNotifications, getAdminUnreadCount, markAdminNotificationAsRead, markAdminAllNotificationsAsRead } from "../controllers/notificationController.js";

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
adminRouter.put("/update-profile", userAuth, upload.single("image"), updateProfile);




adminRouter.get("/bookings",userAuth, adminAuth, getBookings);
adminRouter.get("/transactions",userAuth, adminAuth, getTransactions);
adminRouter.put("/bookings/:id/status",userAuth, adminAuth, updateBookingStatus);
adminRouter.get("/bookings-stats",userAuth, adminAuth, getBookingStats);
adminRouter.get("/bookings/unread-count",userAuth, adminAuth, getUnreadBookingsCount);
adminRouter.put("/bookings/:bookingId/mark-read",userAuth, adminAuth, markBookingAsRead);
adminRouter.put("/bookings/mark-all-read",userAuth, adminAuth, markAllBookingsAsRead);
adminRouter.get("/all-bookings", userAuth, adminAuth, getAllBookings);

// Admin Notification Routes
adminRouter.get("/notifications", userAuth, adminAuth, getAdminNotifications);
adminRouter.get("/notifications/unread-count", userAuth, adminAuth, getAdminUnreadCount);
adminRouter.put("/notifications/:notificationId/mark-read", userAuth, adminAuth, markAdminNotificationAsRead);
adminRouter.put("/notifications/mark-all-read", userAuth, adminAuth, markAdminAllNotificationsAsRead);

export default adminRouter;