import express from "express";
import Chat from "../models/Chat.js";
import Message from "../models/messages.js"; // ✅ Correct import (was missing)
import userAuth from "../middleware/userAuth.js";
import { io } from "../server.js";

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
    console.log("🟡 Fetch messages for participants:", req.user._id, userId);

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

    console.log("🟢 Marked unread messages as read.");

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
      { $match: { receiver: req.user._id, isRead: false } },
      { $group: { _id: "$sender", count: { $sum: 1 } } },
    ]);

    res.json({ success: true, unreadCounts });
  } catch (err) {
    console.error("❌ Error getting unread counts:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default chatRouter;
