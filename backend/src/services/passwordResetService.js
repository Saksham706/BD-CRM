import PasswordReset from "../models/PasswordReset.js";
import User from "../models/User.js";
import { config } from "../config/appConfig.js";
import { generateOpaqueToken, hashToken } from "../utils/generateToken.js";
import { hashPassword, validatePasswordStrength } from "../utils/passwordUtils.js";
import { sendPasswordResetEmail } from "../integrations/googleAppsScript/emailService.js";
import { revokeAllUserSessions } from "./sessionService.js";
import AppError from "../utils/AppError.js";

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  // The controller responds identically whether the account exists or not.
  if (!user || user.accountStatus !== "active") return;

  await PasswordReset.deleteMany({ userId: user._id, usedAt: null });
  const rawToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + config.resetMinutes * 60 * 1000);
  await PasswordReset.create({ userId: user._id, tokenHash: hashToken(rawToken), expiresAt });

  const link = `${config.frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
  try {
    await sendPasswordResetEmail(user, link);
  } catch (error) {
    await PasswordReset.deleteOne({ tokenHash: hashToken(rawToken) });
    throw error;
  }
}

export async function resetPassword(rawToken, newPassword) {
  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) throw new AppError(strengthError, 400, "WEAK_PASSWORD");

  const record = await PasswordReset.findOne({
    tokenHash: hashToken(rawToken || ""), usedAt: null, expiresAt: { $gt: new Date() }
  });
  if (!record) throw new AppError("Invalid or expired password reset link.", 400, "INVALID_RESET_TOKEN");

  const user = await User.findById(record.userId).select("+passwordHash");
  if (!user) throw new AppError("Invalid or expired password reset link.", 400, "INVALID_RESET_TOKEN");

  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  await user.save();

  record.usedAt = new Date();
  await record.save();
  await PasswordReset.deleteMany({ userId: user._id, _id: { $ne: record._id } });
  await revokeAllUserSessions(user._id);
}
