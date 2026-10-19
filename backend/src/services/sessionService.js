import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import Session from "../models/Session.js";
import { config } from "../config/appConfig.js";
import { hashToken } from "../utils/generateToken.js";
import AppError from "../utils/AppError.js";

export function createAccessToken(user) {
  if (!config.jwtAccessSecret || config.jwtAccessSecret.length < 32) {
    throw new Error("JWT_ACCESS_SECRET must be configured with at least 32 characters.");
  }
  return jwt.sign(
    { sub: String(user._id), type: user.accountType },
    config.jwtAccessSecret,
    { expiresIn: config.jwtAccessExpiresIn, issuer: "lead-management-crm", audience: "crm-client" }
  );
}

export async function createRefreshSession(user, req) {
  const rawToken = crypto.randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + config.refreshTokenDays * 24 * 60 * 60 * 1000);
  await Session.create({
    userId: user._id,
    refreshTokenHash: hashToken(rawToken),
    expiresAt,
    userAgent: req.get("user-agent") || "",
    ipAddress: req.ip || ""
  });
  return { rawToken, expiresAt };
}

export async function rotateRefreshSession(rawToken, req) {
  if (!rawToken) throw new AppError("Authentication required.", 401, "AUTH_REQUIRED");
  const tokenHash = hashToken(rawToken);
  const session = await Session.findOne({ refreshTokenHash: tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } });
  if (!session) throw new AppError("Session expired. Please log in again.", 401, "SESSION_EXPIRED");

  const User = (await import("../models/User.js")).default;
  const user = await User.findById(session.userId);
  if (!user || user.accountStatus !== "active" || !user.emailVerifiedAt ||
      user.approvalStatus !== "approved") {
    session.revokedAt = new Date();
    await session.save();
    throw new AppError("This account cannot access the CRM.", 403, "ACCOUNT_NOT_AUTHORIZED");
  }

  session.revokedAt = new Date();
  await session.save();
  const newSession = await createRefreshSession(user, req);
  return { user, refresh: newSession };
}

export async function revokeRefreshSession(rawToken) {
  if (!rawToken) return;
  await Session.updateOne(
    { refreshTokenHash: hashToken(rawToken), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

export async function revokeAllUserSessions(userId) {
  await Session.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}
