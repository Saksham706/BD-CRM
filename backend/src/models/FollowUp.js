import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueAt: { type: Date, required: true, index: true },
    type: {
      type: String,
      enum: ["Call", "Email", "Meeting", "WhatsApp", "Task", "Other"],
      default: "Call",
    },
    remark: { type: String, maxlength: 3000, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Rescheduled", "Cancelled"],
      default: "Pending",
      index: true,
    },
    completedAt: { type: Date, default: null },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    completionRemark: { type: String, maxlength: 3000, default: "" },
    rescheduleHistory: [
      {
        from: Date,
        to: Date,
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
      },
    ],
    reminderMinutes: { type: [Number], default: [0, 15] },
    reminderJobIds: { type: [String], default: [] },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true },
);
schema.index({ ownerId: 1, status: 1, dueAt: 1 });
export default mongoose.model("FollowUp", schema);
