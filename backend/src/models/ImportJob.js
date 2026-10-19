import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["processing", "completed", "completed_with_errors", "failed"],
      default: "processing",
      index: true,
    },

    originalName: {
      type: String,
      required: true,
    },

    totalRows: {
      type: Number,
      default: 0,
    },

    importedRows: {
      type: Number,
      default: 0,
    },

    failedRows: {
      type: Number,
      default: 0,
    },

    // Renamed from "errors" to avoid Mongoose's reserved pathname.
    errorDetails: [
      {
        row: Number,
        message: String,
      },
    ],

    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

schema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model("ImportJob", schema);
