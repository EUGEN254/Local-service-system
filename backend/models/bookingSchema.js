import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    serviceName: String,
    categoryName: String,
    providerName: String,
    amount: Number,
    address: String,
    city: String,
    delivery_date: Date,
    is_paid: { type: Boolean, default: false },
    paymentMethod: { type: String, enum: ["Mpesa", "Cash"], default: "Mpesa" },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
