import LeadFieldDefinition from "../models/LeadFieldDefinition.js";
import AppError from "../utils/AppError.js";
import { writeAudit } from "./auditService.js";

// Get all active custom lead fields.
export async function listLeadFields() {
  return LeadFieldDefinition.find({ active: true })
    .sort({ createdAt: 1 })
    .lean();
}

// Create a custom lead field.
export async function createLeadField(req, data) {
  const doc = await LeadFieldDefinition.create({
    ...data,
    createdBy: req.user._id
  });

  await writeAudit(req, {
    action: "leadField.created",
    targetType: "LeadFieldDefinition",
    targetId: doc._id
  });

  return doc;
}

// Update an existing custom lead field.
export async function updateLeadField(req, id, data) {
  const doc = await LeadFieldDefinition.findById(id);

  if (!doc) {
    throw new AppError(
      "Lead field not found.",
      404,
      "NOT_FOUND"
    );
  }

  Object.assign(doc, data, {
    updatedBy: req.user._id
  });

  await doc.save();

  await writeAudit(req, {
    action: "leadField.updated",
    targetType: "LeadFieldDefinition",
    targetId: doc._id
  });

  return doc;
}