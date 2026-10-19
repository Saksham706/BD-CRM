import mongoose from "mongoose";

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  refreshTokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  revokedAt: { type: Date, default: null },
  userAgent: { type: String, maxlength: 500, default: "" },
  ipAddress: { type: String, maxlength: 100, default: "" },
  lastUsedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Session", schema);
