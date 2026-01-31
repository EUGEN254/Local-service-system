// controllers/notificationController.js
import Notification from "../models/notificationSchema.js";
import User from "../models/userSchema.js";
import { io } from "../../server.js";

// Get all notifications for a user
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { category, read, page = 1, limit = 20 } = req.query;

    const filter = { user: userId };
    
    if (category && category !== "All") {
      filter.category = category;
    }
    
    if (read !== undefined) {
      filter.read = read === "true";
    }

    const notifications = await Notification.find(filter)//find notification that matches these condition
      .sort({ createdAt: -1 })//orders by creation date newest first
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("relatedEntity", "name email serviceName amount status");

    const total = await Notification.countDocuments(filter);

    res.status(200).json({
      success: true,
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      unreadCount: await Notification.countDocuments({ user: userId, read: false })
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ success: false, message: "Failed to mark notification as read" });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );

    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ success: false, message: "Failed to mark all notifications as read" });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Notification.countDocuments({
      user: userId,
      read: false
    });

    res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ success: false, message: "Failed to get unread count" });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
};

// Delete all notifications for the current user
export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id; 

    // Delete all notifications belonging to this user
    const result = await Notification.deleteMany({ user: userId });

    // Check if any notifications were deleted
    if (result.deletedCount === 0) {
      return res.status(200).json({
        success: true,
        message: "No notifications found to delete",
        deletedCount: 0
      });
    }

    // Success response
    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} notifications`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error("Delete all notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notifications",
      error: error.message
    });
  }
};

// Utility function to create notifications (for use in other controllers)
export const createNotification = async (userId, notificationData) => {
  try {
    const notification = new Notification({
      user: userId,
      ...notificationData
    });

    await notification.save();
    
    // Populate before emitting
    const populatedNotification = await Notification.findById(notification._id)
      .populate("relatedEntity", "name email serviceName amount status")
      .populate("user", "name email role");

    //Emit socket event to the specific user
    if (io) {
      // Emit to the specific user's room
      io.to(userId.toString()).emit("newNotification", {
        _id: populatedNotification._id,
        title: populatedNotification.title,
        message: populatedNotification.message,
        type: populatedNotification.type,
        category: populatedNotification.category,
        read: populatedNotification.read,
        createdAt: populatedNotification.createdAt,
        user: populatedNotification.user,
        relatedEntity: populatedNotification.relatedEntity,
      });
    }

    return populatedNotification;
  } catch (error) {
    console.error("Create notification error:", error);
    throw error;
  }
};