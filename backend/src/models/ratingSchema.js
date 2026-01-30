import mongoose from 'mongoose';

const { Schema } = mongoose;

const ratingSchema = new Schema(
  {
    provider: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Prevent duplicate rating per user per provider
ratingSchema.index({ provider: 1, user: 1 }, { unique: true });

export default mongoose.model('Rating', ratingSchema);
