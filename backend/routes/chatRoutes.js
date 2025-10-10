import express from "express";
import Chat from "../models/Chat.js";
import Message from "../models/messages.js";
import userAuth from "../middleware/userAuth.js";

const chatRouter = express.Router();

/* ===========================================================
   GET all chats for current user
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
   GET messages for a specific user and mark unread as read
=========================================================== */
chatRouter.get("/messages/:userId", userAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const chat = await Chat.findOne({ participants: { $all: [req.user._id, userId] } });

    if (!chat) return res.json({ success: true, messages: [] });

    await Message.updateMany(
      { sender: userId, receiver: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true, messages: chat.messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ===========================================================
   Send a message
=========================================================== */
chatRouter.post("/send", userAuth, async (req, res) => {
  try {
    const { receiver, receiverId, text, image, roomId, messageId } = req.body;
    const receiverFinal = receiverId || receiver;
    if (!receiverFinal) return res.status(400).json({ success: false, message: "Receiver ID is required." });

    let chat = await Chat.findOne({ participants: { $all: [req.user._id, receiverFinal] } });
    if (!chat) chat = new Chat({ participants: [req.user._id, receiverFinal], messages: [] });

    const message = { messageId, sender: req.user._id, receiver: receiverFinal, text, image, createdAt: new Date(), isRead: false };
    await Message.create(message);

    chat.messages.push({ messageId, sender: req.user._id, text, image, createdAt: message.createdAt });
    chat.updatedAt = new Date();
    await chat.save();
    await chat.populate("participants", "name email image");

    // Emit real-time message via global.io
    if (roomId && global.io) global.io.to(roomId).emit("receiveMessage", message);

    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ===========================================================
   Get unread message counts
=========================================================== */
chatRouter.get("/unread-count", userAuth, async (req, res) => {
  try {
    const unreadCounts = await Message.aggregate([
      { $match: { receiver: req.user._id, isRead: false } },
      { $group: { _id: "$sender", count: { $sum: 1 } } },
    ]);
    res.json({ success: true, unreadCounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default chatRouter;
