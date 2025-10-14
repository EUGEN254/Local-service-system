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
    phone:{type: Number, required:true},
    is_paid: { type: Boolean, default: false },
    paymentMethod: { type: String, enum: ["Mpesa", "Cash"], default: "Mpesa" },
    status: { type: String, default: "Pending" },
    read: { type: Boolean, default: false }, 
  },
  { timestamps: true }
);

bookingSchema.pre("save", function (next) {
  if (this.isModified("status")) return next(); 
  if (this.is_paid) {
    this.status = "Waiting for Work";
  } else {
    this.status = "Pending";
  }
  next();
});

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;