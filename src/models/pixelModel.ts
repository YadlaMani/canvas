import mongoose from "mongoose";

const pixelSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  color: { type: String, required: true },
  walletAddress: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

const Pixel = mongoose.models.Pixel || mongoose.model("Pixel", pixelSchema);

export default Pixel;
