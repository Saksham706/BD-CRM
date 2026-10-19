import mongoose from "mongoose";
const schema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  format: { type: String, enum: ["csv", "xlsx", "pdf"], required: true },
  reportType: { type: String, required: true }, filters: { type: mongoose.Schema.Types.Mixed, default: {} },
  rowCount: { type: Number, default: 0 }, status: { type: String, enum: ["completed", "failed"], default: "completed" }, generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
schema.index({ createdBy: 1, generatedAt: -1 });
export default mongoose.model("ReportExport", schema);
