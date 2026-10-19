import User from "../models/User.js";
import UserPermission from "../models/UserPermission.js";
import { hashPassword, validatePasswordStrength } from "../utils/passwordUtils.js";
import { issueVerification } from "./emailVerificationService.js";
import { writeAudit } from "./auditService.js";
import AppError from "../utils/AppError.js";

export async function listUsers({ page = 1, limit = 20, status, search } = {}) {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Math.max(1, Number(limit) || 20));
  const filter = { accountType: "user" };
  if (status) filter.approvalStatus = status;
  if (search) {
    const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { fullName: { $regex: escaped, $options: "i" } },
      { loginId: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } }
    ];
  }
  const [items, total] = await Promise.all([
    User.find(filter).select("-passwordHash").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter)
  ]);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function createUserByAdmin(payload, admin, req) {
  const strengthError = validatePasswordStrength(payload.password);
  if (strengthError) throw new AppError(strengthError, 400, "WEAK_PASSWORD");
  const loginId = payload.loginId.trim().toLowerCase();
  const email = payload.email.trim().toLowerCase();
  if (await User.exists({ $or: [{ loginId }, { email }] })) {
    throw new AppError("Login ID or email is already registered.", 409, "ACCOUNT_EXISTS");
  }
  const user = await User.create({
    fullName: payload.fullName.trim(),
    loginId,
    email,
    passwordHash: await hashPassword(payload.password),
    accountType: "user",
    approvalStatus: "pending",
    accountStatus: "active"
  });
  await UserPermission.create({ userId: user._id, permissions: [], updatedBy: admin._id });
  await issueVerification(user);
  await writeAudit(req, { action: "admin.user.created", targetType: "User", targetId: user._id });
  return user;
}

export async function updateUser(userId, payload, admin, req) {
  const user = await User.findById(userId);
  if (!user || user.accountType === "admin") throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  if (payload.fullName !== undefined) user.fullName = payload.fullName.trim();
  if (payload.email !== undefined) {
    const email = payload.email.trim().toLowerCase();
    const duplicate = await User.findOne({ email, _id: { $ne: user._id } });
    if (duplicate) throw new AppError("Email is already in use.", 409, "EMAIL_EXISTS");
    if (email !== user.email) {
      user.email = email;
      user.emailVerifiedAt = null;
      user.approvalStatus = "pending";
      user.approvedAt = null;
      user.approvedBy = null;
      await UserPermission.updateOne({ userId: user._id }, { $set: { permissions: [] } });
    }
  }
  await user.save();
  await writeAudit(req, { action: "admin.user.updated", targetType: "User", targetId: user._id });
  return user;
}

export async function setAccountStatus(userId, status, admin, req) {
  if (!["active", "inactive"].includes(status)) throw new AppError("Invalid account status.", 400, "INVALID_STATUS");
  const user = await User.findById(userId);
  if (!user || user.accountType === "admin") throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  user.accountStatus = status;
  await user.save();
  if (status === "inactive") {
    const { revokeAllUserSessions } = await import("./sessionService.js");
    await revokeAllUserSessions(user._id);
  }
  await writeAudit(req, { action: "admin.user.status_changed", targetType: "User", targetId: user._id, metadata: { status } });
  return user;
}
