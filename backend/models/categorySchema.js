// models/categorySchema.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    image: {
      type: String, // Cloudinary URL
      default: ""
    },
    isActive: {
      type: Boolean,
      default: true
    },
    servicesCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
export default Category;