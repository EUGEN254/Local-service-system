import express from "express";
import Chat from "../models/Chat.js";
import Message from "../models/messages.js";
import Booking from "../models/bookingSchema.js"; 
import userAuth from "../middleware/userAuth.js";
import { io } from "../server.js";
import { v2 as cloudinary } from "cloudinary";
import upload from "../middleware/uploadMiddleware.js";

const chatRouter = express.Router();

/* ===========================================================
   🔹 GET all chats for current user
=========================================================== */
chatRouter.get("/", userAuth, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "name email role image")
      .sort({ updatedAt: -1 });

    res.json({ success: true, chats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ===========================================================
   🔹 GET all customers (for provider)
=========================================================== */
chatRouter.get("/my-customers", userAuth, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
    })
      .populate("participants", "name email image")
      .sort({ updatedAt: -1 });

    const customers = chats
      .map((chat) =>
        chat.participants.find(
          (participant) =>
            participant._id.toString() !== req.user._id.toString()
        )
      )
      .filter(Boolean);

    res.json({ success: true, customers });
  } catch (err) {
    console.error("❌ Error fetching customers:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ===========================================================
   🔹 GET messages for a specific user
   🔹 Marks received messages as read
=========================================================== */
chatRouter.get("/messages/:userId", userAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    

    // Find chat
    const chat = await Chat.findOne({
      participants: { $all: [req.user._id, userId] },
    });

    if (!chat) return res.json({ success: true, messages: [] });

    // ✅ Mark all unread messages from this user as read
    await Message.updateMany(
      { sender: userId, receiver: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    
    res.json({ success: true, messages: chat.messages });
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ===========================================================
   🔹 SEND message (save + emit via socket)
=========================================================== */
chatRouter.post("/send", userAuth, async (req, res) => {
  try {
    // Support both `receiver` and `receiverId`
    const { receiver, receiverId, text, image, roomId, messageId } = req.body;

    const receiverFinal = receiverId || receiver; // ✅ pick whichever exists

    if (!receiverFinal) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required.",
      });
    }

    // Find or create chat between sender and receiver
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, receiverFinal] },
    });

    if (!chat) {
      chat = new Chat({
        participants: [req.user._id, receiverFinal],
        messages: [],
      });
    }

    // ✅ Build message
    const message = {
      messageId,
      sender: req.user._id,
      receiver: receiverFinal,
      text,
      image,
      createdAt: new Date(),
      isRead: false,
    };

    // ✅ Save message for unread tracking
    await Message.create(message);

    // ✅ Push to chat document
    chat.messages.push({
      messageId,
      sender: req.user._id,
      text,
      image,
      createdAt: message.createdAt,
    });

    chat.updatedAt = new Date();
    await chat.save();

    await chat.populate("participants", "name email image");

    // ✅ Emit message in real-time
    if (roomId && io) {
      io.to(roomId).emit("receiveMessage", message);
    }

    res.json({ success: true, message });
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ===========================================================
   🔹 GET unread message counts (for badges / notifications)
=========================================================== */
chatRouter.get("/unread-count", userAuth, async (req, res) => {
  try {
    const unreadCounts = await Message.aggregate([
      { $match: { receiver: req.user._id, isRead: false } },//find current message to the logged in user
      { $group: { _id: "$sender", count: { $sum: 1 } } },//group by sender and count
    ]);

    res.json({ success: true, unreadCounts });
  } catch (err) {
    console.error("❌ Error getting unread counts:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ===========================================================
   🔹 SEND IMAGE (upload to cloudinary + save message)
=========================================================== */
chatRouter.post("/send-image", userAuth, upload.single("image"), async (req, res) => {
  try {
    const { sender, receiver, roomId, messageId, text } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    // Upload image to Cloudinary using req.file.path
    const result = await cloudinary.uploader.upload(req.file.path, { 
      folder: "chat_images" 
    });

    // Find or create chat
    let chat = await Chat.findOne({
      participants: { $all: [sender, receiver] },
    });

    if (!chat) {
      chat = new Chat({
        participants: [sender, receiver],
        messages: [],
      });
    }

    // Create message with image
    const message = {
      messageId,
      sender: req.user._id,
      receiver: receiver,
      text: text || "📷 Image",
      image: result.secure_url,
      createdAt: new Date(),
      isRead: false,
    };

    // Save message for unread tracking
    await Message.create(message);

    // Push to chat document
    chat.messages.push({
      messageId,
      sender: req.user._id,
      text: text || "📷 Image",
      image: result.secure_url,
      createdAt: message.createdAt,
    });

    chat.updatedAt = new Date();
    await chat.save();

    await chat.populate("participants", "name email image");

    // Emit message in real-time
    if (roomId && io) {
      io.to(roomId).emit("receiveMessage", message);
    }

    res.json({ 
      success: true, 
      message,
      imageUrl: result.secure_url 
    });

  } catch (err) {
    console.error("❌ Error in send-image:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

/* ===========================================================
   🔹 MARK MESSAGES AS READ
=========================================================== */
chatRouter.post("/mark-read", userAuth, async (req, res) => {
  try {
    const { senderId } = req.body;

    if (!senderId) {
      return res.status(400).json({
        success: false,
        message: "Sender ID is required",
      });
    }

    // Mark all unread messages from this sender as read
    await Message.updateMany(
      { 
        sender: senderId, 
        receiver: req.user._id, 
        isRead: false 
      },
      { 
        $set: { isRead: true } 
      }
    );

    res.json({ 
      success: true, 
      message: "Messages marked as read" 
    });

  } catch (err) {
    console.error("❌ Error marking messages as read:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

/* ===========================================================
   🔹 BOOKING NOTIFICATION ENDPOINTS
=========================================================== */

// In chatRoutes.js - update the booking-notifications endpoint
chatRouter.get("/booking-notifications", userAuth, async (req, res) => {
  try {
    // Find bookings for this provider by NAME
    const notifications = await Booking.find({
      providerName: req.user.name, // Use providerName field
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })
    .populate('customer', 'name email')
    .sort({ createdAt: -1 });

    const unreadCount = await Booking.countDocuments({
      providerName: req.user.name,
      read: false
    });

    // Format notifications
    const formattedNotifications = notifications.map(booking => ({
      _id: booking._id,
      serviceName: booking.serviceName,
      categoryName: booking.categoryName,
      customerName: booking.customer?.name || 'Unknown Customer',
      customerEmail: booking.customer?.email || '',
      amount: booking.amount,
      address: booking.address,
      city: booking.city,
      delivery_date: booking.delivery_date,
      status: booking.status,
      is_paid: booking.is_paid,
      paymentMethod: booking.paymentMethod,
      read: booking.read,
      createdAt: booking.createdAt,
      customerId: booking.customer?._id,
      providerName: booking.providerName
    }));

    res.json({
      success: true,
      notifications: formattedNotifications,
      unreadCount
    });
  } catch (error) {
    console.error("❌ Error fetching booking notifications:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
/* ===========================================================
   🔹 MARK single booking notification as read
=========================================================== */
chatRouter.post("/mark-notification-read", userAuth, async (req, res) => {
  try {
    const { notificationId } = req.body;
    
    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is required"
      });
    }

    await Booking.findByIdAndUpdate(notificationId, { read: true });
    
    res.json({ 
      success: true, 
      message: "Notification marked as read" 
    });
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ===========================================================
   🔹 MARK ALL booking notifications as read
=========================================================== */
chatRouter.post("/mark-all-notifications-read", userAuth, async (req, res) => {
  try {
    const providerName = req.user.name; // Use the user's name, not ID
    
    await Booking.updateMany(
      { 
        providerName: providerName, // Compare string with string
        read: false 
      },
      { 
        $set: { read: true } 
      }
    );
    
    res.json({ 
      success: true, 
      message: "All notifications marked as read" 
    });
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default chatRouter;