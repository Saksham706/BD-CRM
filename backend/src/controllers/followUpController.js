import mongoose from "mongoose";
import FollowUp from "../models/FollowUp.js";
import Lead from "../models/Lead.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/apiResponse.js";
import { findAccessibleLead, isAdmin } from "../services/leadService.js";
import {
  scheduleFollowupReminders,
  cancelFollowupReminders,
} from "../services/followupQueueService.js";
import { recordActivity } from "../services/activityService.js";
import { writeAudit } from "../services/auditService.js";
import { createNotification } from "../services/notificationService.js";
import { emitToUsers } from "../sockets/socketServer.js";

async function accessibleFollowup(id, user) {
  if (!mongoose.isValidObjectId(id))
    throw new AppError("Invalid follow-up ID.", 400, "INVALID_ID");
  const f = await FollowUp.findById(id);
  if (!f) throw new AppError("Follow-up not found.", 404, "FOLLOWUP_NOT_FOUND");
  await findAccessibleLead(f.leadId, user);
  if (
    !isAdmin(user) &&
    String(f.ownerId) !== String(user._id) &&
    String(f.createdBy) !== String(user._id)
  )
    throw new AppError("Follow-up access denied.", 403, "FORBIDDEN");
  return f;
}
export const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1),
    limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const leadIds = await Lead.find(
    isAdmin(req.user)
      ? { archivedAt: null }
      : {
          archivedAt: null,
          $or: [{ ownerId: req.user._id }, { createdBy: req.user._id }],
        },
  ).distinct("_id");
  const filter = { leadId: { $in: leadIds } };
  if (req.query.status && req.query.status !== "Overdue")
    filter.status = req.query.status;
  if (req.query.status === "Overdue") {
    filter.status = { $in: ["Pending", "Rescheduled"] };
    filter.dueAt = { $lt: new Date() };
  }
  if (req.query.view === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    filter.dueAt = { $gte: start, $lt: end };
  }
  if (req.query.view === "upcoming") filter.dueAt = { $gte: new Date() };
  const [items, total] = await Promise.all([
    FollowUp.find(filter)
      .sort({ dueAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("leadId", "leadCode displayName status ownerId")
      .populate("ownerId", "fullName loginId")
      .lean(),
    FollowUp.countDocuments(filter),
  ]);
  return success(res, "Follow-ups retrieved", {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});
export const create = asyncHandler(async (req, res) => {
  const lead = await findAccessibleLead(req.body.leadId, req.user);
  const dueAt = new Date(req.body.dueAt);
  if (Number.isNaN(dueAt.getTime()) || dueAt.getTime() < Date.now() - 60_000)
    throw new AppError(
      "dueAt must be a valid current or future date/time.",
      400,
      "INVALID_DUE_DATE",
    );
  let ownerId = req.user._id;
  if (req.body.ownerId) {
    if (!isAdmin(req.user))
      throw new AppError(
        "Only Admin can assign a follow-up to another employee.",
        403,
        "PERMISSION_DENIED",
      );
    const owner = await User.findOne({
      _id: req.body.ownerId,
      accountStatus: "active",
      approvalStatus: "approved",
      emailVerifiedAt: { $ne: null },
    });
    if (!owner)
      throw new AppError(
        "Follow-up owner is not eligible.",
        400,
        "INVALID_OWNER",
      );
    ownerId = owner._id;
  } else if (lead.ownerId) ownerId = lead.ownerId;
  const f = await FollowUp.create({
    leadId: lead._id,
    ownerId,
    createdBy: req.user._id,
    dueAt,
    type: req.body.type || "Call",
    remark: req.body.remark || "",
    reminderMinutes: Array.isArray(req.body.reminderMinutes)
      ? req.body.reminderMinutes
      : [15, 0],
  });
  await scheduleFollowupReminders(f);
  lead.nextFollowUpAt = dueAt;
  if (!["Converted", "Lost"].includes(lead.status))
    lead.status = "Follow-up Required";
  await lead.save();
  await recordActivity({
    leadId: lead._id,
    actorId: req.user._id,
    eventType: "followup.created",
    summary: `Follow-up scheduled for ${dueAt.toISOString()}`,
    payload: { followupId: f._id, dueAt, type: f.type },
  });
  await writeAudit(req, {
    action: "followup.created",
    targetType: "FollowUp",
    targetId: f._id,
    metadata: { leadId: lead._id, dueAt },
  });
  emitToUsers([ownerId, req.user._id], "followup.created", {
    followupId: String(f._id),
    leadId: String(lead._id),
    dueAt,
  });
  return success(res, "Follow-up scheduled", f, 201);
});
export const complete = asyncHandler(async (req, res) => {
  const f = await accessibleFollowup(req.params.id, req.user);
  if (["Completed", "Cancelled"].includes(f.status))
    throw new AppError(
      `Cannot complete a ${f.status.toLowerCase()} follow-up.`,
      409,
      "INVALID_FOLLOWUP_STATE",
    );
  f.status = "Completed";
  f.completedAt = new Date();
  f.completedBy = req.user._id;
  f.completionRemark = String(req.body.remark || "").trim();
  await cancelFollowupReminders(f);
  await f.save();
  const lead = await Lead.findById(f.leadId);
  await recordActivity({
    leadId: f.leadId,
    actorId: req.user._id,
    eventType: "followup.completed",
    summary: "Follow-up completed",
    payload: { followupId: f._id, remark: f.completionRemark },
  });
  if (lead) {
    const next = await FollowUp.findOne({
      leadId: lead._id,
      status: { $in: ["Pending", "Rescheduled"] },
      dueAt: { $gte: new Date() },
    }).sort({ dueAt: 1 });
    lead.nextFollowUpAt = next?.dueAt || null;
    await lead.save();
  }
  await writeAudit(req, {
    action: "followup.completed",
    targetType: "FollowUp",
    targetId: f._id,
  });
  emitToUsers([f.ownerId, f.createdBy, req.user._id], "followup.completed", {
    followupId: String(f._id),
    leadId: String(f.leadId),
  });
  return success(res, "Follow-up completed", f);
});
export const reschedule = asyncHandler(async (req, res) => {
  const f = await accessibleFollowup(req.params.id, req.user);
  if (["Completed", "Cancelled"].includes(f.status))
    throw new AppError(
      "Completed or cancelled follow-ups cannot be rescheduled.",
      409,
      "INVALID_FOLLOWUP_STATE",
    );
  const dueAt = new Date(req.body.dueAt);
  if (Number.isNaN(dueAt.getTime()) || dueAt.getTime() <= Date.now())
    throw new AppError("dueAt must be in the future.", 400, "INVALID_DUE_DATE");
  await cancelFollowupReminders(f);
  f.rescheduleHistory.push({
    from: f.dueAt,
    to: dueAt,
    actorId: req.user._id,
    reason: String(req.body.reason || ""),
  });
  f.dueAt = dueAt;
  f.status = "Rescheduled";
  await scheduleFollowupReminders(f);
  await f.save();
  await Lead.findByIdAndUpdate(f.leadId, { nextFollowUpAt: dueAt });
  await recordActivity({
    leadId: f.leadId,
    actorId: req.user._id,
    eventType: "followup.rescheduled",
    summary: `Follow-up rescheduled to ${dueAt.toISOString()}`,
    payload: { followupId: f._id, dueAt },
  });
  await writeAudit(req, {
    action: "followup.rescheduled",
    targetType: "FollowUp",
    targetId: f._id,
    metadata: { dueAt },
  });
  emitToUsers([f.ownerId, f.createdBy, req.user._id], "followup.rescheduled", {
    followupId: String(f._id),
    leadId: String(f.leadId),
    dueAt,
  });
  return success(res, "Follow-up rescheduled", f);
});
export const cancel = asyncHandler(async (req, res) => {
  const f = await accessibleFollowup(req.params.id, req.user);
  if (f.status === "Completed")
    throw new AppError(
      "Completed follow-ups cannot be cancelled.",
      409,
      "INVALID_FOLLOWUP_STATE",
    );
  await cancelFollowupReminders(f);
  f.status = "Cancelled";
  f.cancelledAt = new Date();
  await f.save();
  await recordActivity({
    leadId: f.leadId,
    actorId: req.user._id,
    eventType: "followup.cancelled",
    summary: "Follow-up cancelled",
    payload: { followupId: f._id, reason: req.body.reason || "" },
  });
  await writeAudit(req, {
    action: "followup.cancelled",
    targetType: "FollowUp",
    targetId: f._id,
  });
  emitToUsers([f.ownerId, f.createdBy, req.user._id], "followup.cancelled", {
    followupId: String(f._id),
    leadId: String(f.leadId),
  });
  return success(res, "Follow-up cancelled", f);
});
