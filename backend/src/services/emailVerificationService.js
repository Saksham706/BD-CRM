import EmailVerification from "../models/EmailVerification.js";
import User from "../models/User.js";
import { config } from "../config/appConfig.js";
import { generateOpaqueToken, hashToken } from "../utils/generateToken.js";
import AppError from "../utils/AppError.js";
import { sendVerificationEmail } from "../integrations/googleAppsScript/emailService.js";

export async function issueVerification(user) {
  await EmailVerification.deleteMany({ userId: user._id, usedAt: null });
  const rawToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + config.verificationMinutes * 60 * 1000);
  await EmailVerification.create({ userId: user._id, tokenHash: hashToken(rawToken), expiresAt });
  const link = `${config.frontendUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;
  try {
    await sendVerificationEmail(user, link);
  } catch (error) {
    await EmailVerification.deleteOne({ tokenHash: hashToken(rawToken) });
    throw error;
  }
}

export async function verifyEmail(rawToken) {
  if (!rawToken || typeof rawToken !== "string") throw new AppError("Invalid or expired verification link.", 400, "INVALID_VERIFICATION_TOKEN");
  const record = await EmailVerification.findOne({
    tokenHash: hashToken(rawToken), usedAt: null, expiresAt: { $gt: new Date() }
  });
  if (!record) throw new AppError("Invalid or expired verification link.", 400, "INVALID_VERIFICATION_TOKEN");

  const user = await User.findById(record.userId);
  if (!user) throw new AppError("Invalid or expired verification link.", 400, "INVALID_VERIFICATION_TOKEN");
  record.usedAt = new Date();
  await record.save();
  if (!user.emailVerifiedAt) {
    user.emailVerifiedAt = new Date();
    await user.save();
  }
  return { emailVerified: true, approvalStatus: user.approvalStatus };
}

export async function resendVerification(email) {
  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  // Avoid exposing account existence; controller always returns the same message.
  if (!user || user.emailVerifiedAt || user.approvalStatus === "rejected") return;
  await issueVerification(user);
}
