import mongoose from "mongoose";

const plumbingServiceSchema = new mongoose.Schema({
  category: { type: String, required: true },
  serviceName: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: "Active" },
  dateAdded: { type: Date, default: Date.now },
  image: { 
    type: String,    
    required: true // image is required
  },
  serviceProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true, // store the actual service provider ID
  },
  serviceProviderName: { 
    type: String, 
    required: true // store name for display
  },
});

export default mongoose.model("PlumbingService", plumbingServiceSchema);
