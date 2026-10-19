import mongoose from "mongoose";

const schema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  action: { type: String, required: true, index: true },
  targetType: { type: String, required: true },
  targetId: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: "" },
  userAgent: { type: String, default: "" }
}, { timestamps: true });

schema.index({ createdAt: -1 });
export default mongoose.model("AuditLog", schema);
