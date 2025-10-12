// models/notificationSchema.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["user", "service-provider", "booking", "transaction", "system", "verification"],
      default: "system"
    },
    category: {
      type: String,
      enum: ["User", "Service Provider", "Booking", "Transaction", "System", "Verification"],
      default: "System"
    },
    read: {
      type: Boolean,
      default: false
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    actionUrl: {
      type: String // URL to redirect when notification is clicked
    },
    relatedEntity: {
      type: mongoose.Schema.Types.ObjectId, // Reference to related booking, user, etc.
      refPath: 'relatedEntityModel'
    },
    relatedEntityModel: {
      type: String,
      enum: ["User", "Booking", "Service", "Transaction"]
    },
    expiresAt: {
      type: Date // Auto-delete notifications after this date
    }
  },
  { timestamps: true }
);

// Auto-delete expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;