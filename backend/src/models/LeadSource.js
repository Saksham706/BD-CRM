import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      unique: true,
    },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    active: { type: Boolean, default: true, index: true },
    integrationType: {
      type: String,
      enum: ["manual", "csv", "api", "webhook"],
      default: "manual",
    },
    configReference: { type: String, default: "", select: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
export default mongoose.model("LeadSource", schema);
