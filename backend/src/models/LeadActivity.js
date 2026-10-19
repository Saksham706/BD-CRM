import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    eventType: { type: String, required: true, index: true },
    summary: { type: String, required: true, maxlength: 500 },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);
schema.index({ leadId: 1, createdAt: -1 });
export default mongoose.model("LeadActivity", schema);
