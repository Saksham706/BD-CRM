import User from "../models/User.js";
import UserPermission from "../models/UserPermission.js";
import { hashPassword, comparePassword, validatePasswordStrength } from "../utils/passwordUtils.js";
import { issueVerification } from "./emailVerificationService.js";
import { createAccessToken, createRefreshSession, revokeRefreshSession } from "./sessionService.js";
import { getUserPermissionKeys } from "./permissionService.js";
import { writeAudit } from "./auditService.js";
import AppError from "../utils/AppError.js";

const publicUser = (user) => ({
  id: String(user._id),
  fullName: user.fullName,
  loginId: user.loginId,
  email: user.email,
  accountType: user.accountType,
  emailVerified: Boolean(user.emailVerifiedAt),
  approvalStatus: user.approvalStatus,
  accountStatus: user.accountStatus
});

export async function registerUser(payload, req) {
  const strengthError = validatePasswordStrength(payload.password);
  if (strengthError) throw new AppError(strengthError, 400, "WEAK_PASSWORD");
  const loginId = payload.loginId.trim().toLowerCase();
  const email = payload.email.trim().toLowerCase();
  const exists = await User.findOne({ $or: [{ loginId }, { email }] });
  if (exists) throw new AppError("Login ID or email is already registered.", 409, "ACCOUNT_EXISTS");

  const user = await User.create({
    fullName: payload.fullName.trim(),
    loginId,
    email,
    passwordHash: await hashPassword(payload.password),
    accountType: "user",
    approvalStatus: "pending",
    accountStatus: "active"
  });
  await UserPermission.create({ userId: user._id, permissions: [], updatedBy: null });

  try {
    await issueVerification(user);
  } catch (error) {
    // Keep the account so a resend/recovery path is possible; no CRM access is granted.
    console.error("Verification email could not be sent:", error.message);
  }
  await writeAudit(req, { action: "auth.register", targetType: "User", targetId: user._id, metadata: { email: user.email } });
  return publicUser(user);
}

export async function loginUser({ loginId, password }, req) {
  const user = await User.findOne({ loginId: String(loginId).toLowerCase().trim() }).select("+passwordHash");
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw new AppError("Invalid login ID or password.", 401, "INVALID_CREDENTIALS");
  }
  if (user.accountStatus !== "active") throw new AppError("This account is inactive. Contact the administrator.", 403, "ACCOUNT_INACTIVE");
  if (!user.emailVerifiedAt) throw new AppError("Verify your email address before logging in.", 403, "EMAIL_NOT_VERIFIED");
  if (user.approvalStatus !== "approved") {
    const message = user.approvalStatus === "rejected"
      ? "Your registration was not approved. Contact the administrator."
      : "Your account is awaiting Admin approval.";
    throw new AppError(message, 403, "ADMIN_APPROVAL_REQUIRED");
  }

  user.lastLoginAt = new Date();
  await user.save();
  const accessToken = createAccessToken(user);
  const refresh = await createRefreshSession(user, req);
  await writeAudit(req, { action: "auth.login", targetType: "User", targetId: user._id });
  return { user: publicUser(user), accessToken, refreshToken: refresh.rawToken, refreshExpiresAt: refresh.expiresAt };
}

export async function logoutUser(refreshToken, req) {
  await revokeRefreshSession(refreshToken);
  if (req.user) await writeAudit(req, { action: "auth.logout", targetType: "User", targetId: req.user._id });
}

export async function getCurrentUser(user) {
  const permissions = await getUserPermissionKeys(user);
  return { ...publicUser(user), permissions };
}

export { publicUser };
