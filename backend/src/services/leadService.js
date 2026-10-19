import mongoose from "mongoose";
import Lead, { LEAD_STATUSES } from "../models/Lead.js";
import LeadAssignment from "../models/LeadAssignment.js";
import LeadActivity from "../models/LeadActivity.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { recordActivity } from "./activityService.js";
import { writeAudit } from "./auditService.js";
import { emitToUsers } from "../sockets/socketServer.js";
import { createNotification } from "./notificationService.js";
import { getUserPermissionKeys } from "./permissionService.js";

export function isAdmin(user) { return user?.accountType === "admin"; }
export function leadScope(user, canSeeAll = false) {
  if (isAdmin(user) || canSeeAll) return { archivedAt: null };
  return { archivedAt: null, $or: [{ ownerId: user._id }, { createdBy: user._id }] };
}
export async function findAccessibleLead(id, user, { includeArchived = false } = {}) {
  if (!mongoose.isValidObjectId(id)) throw new AppError("Invalid lead ID.", 400, "INVALID_ID");
  const filter = isAdmin(user) ? { _id: id } : { _id: id, $or: [{ ownerId: user._id }, { createdBy: user._id }] };
  if (!includeArchived) filter.archivedAt = null;
  const lead = await Lead.findOne(filter);
  if (!lead) throw new AppError("Lead not found or access denied.", 404, "LEAD_NOT_FOUND");
  return lead;
}
function nextCode() { return `LD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`; }
export async function listLeads({ user, query }) {
  const page = Math.max(1, Number(query.page) || 1), limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const filter = leadScope(user);
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.ownerId && isAdmin(user)) filter.ownerId = query.ownerId;
  if (query.source) filter.source = query.source;
  if (query.from || query.to) filter.createdAt = { ...(query.from ? { $gte: new Date(query.from) } : {}), ...(query.to ? { $lte: new Date(query.to) } : {}) };
  if (query.search) filter.$text = { $search: query.search };
  const [items, total] = await Promise.all([Lead.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).populate("ownerId", "fullName email loginId").populate("createdBy", "fullName loginId").lean(), Lead.countDocuments(filter)]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
export async function createLead({ req, data }) {
  let ownerId = req.user._id;
  if (data.ownerId) {
    if (!isAdmin(req.user) && !(await getUserPermissionKeys(req.user)).includes("leads.assign")) throw new AppError("Permission required to assign leads.", 403, "PERMISSION_DENIED");
    const owner = await User.findOne({ _id: data.ownerId, accountStatus: "active", emailVerifiedAt: { $ne: null }, approvalStatus: "approved" });
    if (!owner) throw new AppError("Selected owner is not an eligible active user.", 400, "INVALID_OWNER");
    ownerId = owner._id;
  }
  const lead = await Lead.create({ ...data, leadCode: nextCode(), ownerId, createdBy: req.user._id });
  await recordActivity({ leadId: lead._id, actorId: req.user._id, eventType: "lead.created", summary: "Lead created", payload: { status: lead.status } });
  await writeAudit(req, { action: "lead.created", targetType: "Lead", targetId: lead._id, metadata: { leadCode: lead.leadCode } });
  emitToUsers([lead.ownerId, req.user._id], "lead.created", { leadId: String(lead._id), leadCode: lead.leadCode });
  if (String(lead.ownerId) !== String(req.user._id)) await createNotification({ userId: lead.ownerId, type: "lead.assigned", title: "Lead assigned", message: `You have been assigned lead ${lead.leadCode}.`, link: `/leads/${lead._id}`, entityType: "Lead", entityId: lead._id });
  return lead;
}
export async function updateLead({ req, id, data }) {
  const lead = await findAccessibleLead(id, req.user);
  if (data.ownerId && String(data.ownerId) !== String(lead.ownerId || "")) throw new AppError("Use the assignment endpoint to change lead ownership.", 400, "USE_ASSIGNMENT_ENDPOINT");
  const oldStatus = lead.status;
  const allowed = ["firstName", "lastName", "displayName", "email", "phone", "company", "source", "priority", "description", "customFields", "lostReason"];
  for (const key of allowed) if (data[key] !== undefined) lead[key] = data[key];
  if (data.status !== undefined && data.status !== oldStatus) {
    if (!LEAD_STATUSES.includes(data.status)) throw new AppError("Invalid lead status.", 400, "INVALID_STATUS");
    if (oldStatus === "Converted" || oldStatus === "Lost") throw new AppError("Closed leads must be explicitly reopened by an Admin before changing status.", 409, "LEAD_CLOSED");
    if (["Converted", "Lost"].includes(data.status) && !isAdmin(req.user) && !(await getUserPermissionKeys(req.user)).includes("leads.edit")) throw new AppError("Permission required to close leads.", 403, "PERMISSION_DENIED");
    lead.status = data.status;
    if (data.status === "Converted") lead.convertedAt = new Date();
    if (data.status === "Lost" && !data.lostReason) throw new AppError("A loss reason is required.", 400, "LOSS_REASON_REQUIRED");
  }
  await lead.save();
  if (oldStatus !== lead.status) await recordActivity({ leadId: lead._id, actorId: req.user._id, eventType: "lead.status_changed", summary: `Status changed from ${oldStatus} to ${lead.status}`, payload: { from: oldStatus, to: lead.status } });
  await recordActivity({ leadId: lead._id, actorId: req.user._id, eventType: "lead.updated", summary: "Lead details updated", payload: { changedFields: Object.keys(data) } });
  await writeAudit(req, { action: "lead.updated", targetType: "Lead", targetId: lead._id, metadata: { changedFields: Object.keys(data) } });
  emitToUsers([lead.ownerId, lead.createdBy, req.user._id], oldStatus !== lead.status ? "lead.status_changed" : "lead.updated", { leadId: String(lead._id), status: lead.status });
  return lead;
}
export async function assignLead({ req, id, ownerId, reason = "" }) {
  const lead = await findAccessibleLead(id, req.user);
  if (!isAdmin(req.user) && !(await getUserPermissionKeys(req.user)).includes("leads.assign")) throw new AppError("You do not have permission to assign leads.", 403, "PERMISSION_DENIED");
  let owner = null;
  if (ownerId) {
    owner = await User.findOne({ _id: ownerId, accountStatus: "active", emailVerifiedAt: { $ne: null }, approvalStatus: "approved" });
    if (!owner) throw new AppError("Selected owner is not an eligible active user.", 400, "INVALID_OWNER");
  }
  const previousOwner = lead.ownerId;
  lead.ownerId = owner?._id || null;
  await lead.save();
  await LeadAssignment.create({ leadId: lead._id, oldOwnerId: previousOwner || null, newOwnerId: owner?._id || null, actorId: req.user._id, reason });
  await recordActivity({ leadId: lead._id, actorId: req.user._id, eventType: "lead.assigned", summary: owner ? `Lead assigned to ${owner.fullName}` : "Lead unassigned", payload: { oldOwnerId: previousOwner, newOwnerId: owner?._id || null, reason } });
  await writeAudit(req, { action: "lead.assigned", targetType: "Lead", targetId: lead._id, metadata: { oldOwnerId: previousOwner, newOwnerId: owner?._id || null, reason } });
  emitToUsers([previousOwner, owner?._id, lead.createdBy, req.user._id], "lead.assigned", { leadId: String(lead._id), ownerId: owner?._id || null });
  if (owner && String(owner._id) !== String(previousOwner || "")) await createNotification({ userId: owner._id, type: "lead.assigned", title: "Lead assigned", message: `Lead ${lead.leadCode} has been assigned to you.`, link: `/leads/${lead._id}`, entityType: "Lead", entityId: lead._id });
  return lead;
}
export async function getLeadDetails({ id, user }) {
  const lead = await findAccessibleLead(id, user);
  const [activities, assignments] = await Promise.all([LeadActivity.find({ leadId: lead._id }).sort({ createdAt: -1 }).limit(100).populate("actorId", "fullName loginId").lean(), LeadAssignment.find({ leadId: lead._id }).sort({ createdAt: -1 }).populate("actorId oldOwnerId newOwnerId", "fullName loginId").lean()]);
  return { lead, activities, assignments };
}
export async function archiveLead({ req, id }) {
  const lead = await findAccessibleLead(id, req.user);
  lead.archivedAt = new Date(); await lead.save();
  await recordActivity({ leadId: lead._id, actorId: req.user._id, eventType: "lead.archived", summary: "Lead archived" });
  await writeAudit(req, { action: "lead.archived", targetType: "Lead", targetId: lead._id });
  emitToUsers([lead.ownerId, lead.createdBy, req.user._id], "lead.updated", { leadId: String(lead._id), archived: true });
  return lead;
}
