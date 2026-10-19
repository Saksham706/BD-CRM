import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, required: true },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 1000 },
    link: { type: String, default: "" },
    entityType: { type: String, default: "" },
    entityId: { type: String, default: "" },
    dedupeKey: { type: String, default: null },
    readAt: { type: Date, default: null, index: true },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true },
);
schema.index({ userId: 1, createdAt: -1 });
schema.index({ dedupeKey: 1 }, { unique: true, sparse: true });
export default mongoose.model("Notification", schema);
