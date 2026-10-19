import mongoose from "mongoose";

export const LEAD_STATUSES = [
  "New",
  "Contact Attempted",
  "Contacted",
  "Qualified",
  "In Process",
  "Follow-up Required",
  "Meeting Scheduled",
  "Proposal Sent",
  "On Hold",
  "Converted",
  "Lost",
  "Invalid Lead",
  "Not Interested",
];
const leadSchema = new mongoose.Schema(
  {
    leadCode: { type: String, unique: true, index: true },
    firstName: { type: String, trim: true, maxlength: 100 },
    lastName: { type: String, trim: true, maxlength: 100, default: "" },
    displayName: { type: String, required: true, trim: true, maxlength: 200 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      default: "",
    },
    phone: { type: String, trim: true, maxlength: 40, default: "" },
    company: { type: String, trim: true, maxlength: 200, default: "" },
    source: { type: String, trim: true, maxlength: 100, default: "Manual" },
    status: { type: String, enum: LEAD_STATUSES, default: "New", index: true },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    description: { type: String, maxlength: 5000, default: "" },
    customFields: { type: mongoose.Schema.Types.Mixed, default: {} },
    nextFollowUpAt: { type: Date, default: null, index: true },
    convertedAt: { type: Date, default: null },
    lostReason: { type: String, maxlength: 1000, default: "" },
    archivedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, minimize: false },
);
leadSchema.index({
  displayName: "text",
  email: "text",
  phone: "text",
  company: "text",
});
leadSchema.index({ ownerId: 1, status: 1, updatedAt: -1 });
leadSchema.index({ teamId: 1, status: 1, updatedAt: -1 });
export default mongoose.model("Lead", leadSchema);
