import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Link || mongoose.model('Link', linkSchema);
