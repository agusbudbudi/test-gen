import mongoose from 'mongoose';

const CacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g., 'dashboard_metrics'
  data: mongoose.Schema.Types.Mixed,
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Cache = mongoose.models.Cache || mongoose.model('Cache', CacheSchema);
