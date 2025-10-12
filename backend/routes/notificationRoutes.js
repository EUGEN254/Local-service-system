// routes/notificationRoutes.js
import express from "express";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification
} from "../controllers/notificationController.js";
import userAuth from "../middleware/userAuth.js";

const notificationRouter = express.Router();

notificationRouter.get("/", userAuth, getUserNotifications);
notificationRouter.get("/unread-count", userAuth, getUnreadCount);
notificationRouter.put("/mark-read/:notificationId", userAuth, markAsRead);
notificationRouter.put("/mark-all-read", userAuth, markAllAsRead);
notificationRouter.delete("/:notificationId", userAuth, deleteNotification);

export default notificationRouter;