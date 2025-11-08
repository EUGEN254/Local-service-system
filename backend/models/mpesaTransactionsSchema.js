// models/mpesaTransactionSchema.js
import mongoose from "mongoose";

const mpesaTransactionSchema = new mongoose.Schema(
  {
    customer: { type: String, required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    serviceName: { type: String },
    amount: { type: Number, required: true },
    phone: { type: String, required: true },
    transactionId: { type: String }, // M-Pesa CheckoutRequestID
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    callbackData: { type: Object }, // store callback response
  },
  { timestamps: true }
);

export default mongoose.model("MpesaTransaction", mpesaTransactionSchema);
