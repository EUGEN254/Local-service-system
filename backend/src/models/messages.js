import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true, 
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PlumbingService", // optional
  },
  text: { type: String },
  image: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isRead: { type: Boolean, default: false },
});

export default mongoose.model("Message", messageSchema);
