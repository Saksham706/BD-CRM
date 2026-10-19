import LeadSource from "../models/LeadSource.js";
import AppError from "../utils/AppError.js";
import { writeAudit } from "./auditService.js";
export async function listLeadSources() {
  return LeadSource.find({ active: true })
    .select("-configReference")
    .sort({ name: 1 })
    .lean();
}
export async function createLeadSource(req, data) {
  const doc = await LeadSource.create({ ...data, createdBy: req.user._id });
  await writeAudit(req, {
    action: "leadSource.created",
    targetType: "LeadSource",
    targetId: doc._id,
    metadata: { name: doc.name },
  });
  return doc;
}
export async function updateLeadSource(req, id, data) {
  const doc = await LeadSource.findById(id);
  if (!doc) throw new AppError("Lead source not found.", 404, "NOT_FOUND");
  Object.assign(doc, data, { updatedBy: req.user._id });
  await doc.save();
  await writeAudit(req, {
    action: "leadSource.updated",
    targetType: "LeadSource",
    targetId: doc._id,
  });
  return doc;
}
