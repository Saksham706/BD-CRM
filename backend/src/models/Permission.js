import mongoose from "mongoose";

const schema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  module: { type: String, required: true },
  action: { type: String, required: true },
  description: { type: String, default: "" },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Permission", schema);
