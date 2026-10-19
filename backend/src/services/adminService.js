import User from "../models/User.js";
import UserPermission from "../models/UserPermission.js";
import { assignUserPermissions } from "./permissionService.js";
import { sendAccountApprovedEmail, sendAccountRejectedEmail } from "../integrations/googleAppsScript/emailService.js";
import { writeAudit } from "./auditService.js";
import AppError from "../utils/AppError.js";

export async function listPendingUsers() {
  return User.find({
    accountType: "user",
    emailVerifiedAt: { $ne: null },
    approvalStatus: "pending"
  }).select("-passwordHash").sort({ createdAt: 1 }).lean();
}

export async function approveUser(userId, admin, req) {
  const user = await User.findById(userId);
  if (!user || user.accountType === "admin") throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  if (!user.emailVerifiedAt) throw new AppError("User must verify their email before approval.", 409, "EMAIL_VERIFICATION_REQUIRED");
  if (user.approvalStatus === "rejected") throw new AppError("Rejected account must be reviewed through the reactivation workflow.", 409, "ACCOUNT_REJECTED");

  user.approvalStatus = "approved";
  user.approvedAt = new Date();
  user.approvedBy = admin._id;
  user.rejectionReason = null;
  await user.save();
  await UserPermission.updateOne({ userId: user._id }, { $setOnInsert: { permissions: [], updatedBy: admin._id } }, { upsert: true });
  await writeAudit(req, { action: "admin.user.approved", targetType: "User", targetId: user._id });
  // Account approval remains committed even if email delivery fails.
  sendAccountApprovedEmail(user).catch((e) => console.error("Approval email failed:", e.message));
  return user;
}

export async function rejectUser(userId, reason, admin, req) {
  const user = await User.findById(userId);
  if (!user || user.accountType === "admin") throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  user.approvalStatus = "rejected";
  user.rejectionReason = reason?.trim() || "Registration not approved";
  user.approvedAt = null;
  user.approvedBy = admin._id;
  await user.save();
  await writeAudit(req, { action: "admin.user.rejected", targetType: "User", targetId: user._id, metadata: { reason: user.rejectionReason } });
  sendAccountRejectedEmail(user).catch((e) => console.error("Rejection email failed:", e.message));
  return user;
}

export async function setUserPermissions(userId, permissions, admin, req) {
  const user = await User.findById(userId);
  if (!user || user.accountType === "admin") throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  if (user.approvalStatus !== "approved") throw new AppError("Approve the account before assigning CRM permissions.", 409, "APPROVAL_REQUIRED");
  const record = await assignUserPermissions({ userId, permissions, actorId: admin._id });
  await writeAudit(req, {
    action: "admin.user.permissions_updated",
    targetType: "User",
    targetId: user._id,
    metadata: { permissions: record.permissions }
  });
  return record;
}
