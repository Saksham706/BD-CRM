import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[a-z][a-zA-Z0-9_]*$/,
      unique: true,
      index: true,
    },
    label: { type: String, required: true, trim: true, maxlength: 100 },
    type: {
      type: String,
      enum: [
        "text",
        "email",
        "phone",
        "number",
        "date",
        "boolean",
        "select",
        "textarea",
      ],
      required: true,
    },
    required: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
    options: { type: [String], default: [] },
    validation: { type: mongoose.Schema.Types.Mixed, default: {} },
    permissions: {
      read: { type: [String], default: [] },
      write: { type: [String], default: [] },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
export default mongoose.model("LeadFieldDefinition", schema);
