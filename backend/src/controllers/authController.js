import { z } from "zod";
import { success } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/authService.js";
import * as verificationService from "../services/emailVerificationService.js";
import * as resetService from "../services/passwordResetService.js";
import { rotateRefreshSession } from "../services/sessionService.js";
import { config } from "../config/appConfig.js";
import AppError from "../utils/AppError.js";

const cookieBase = {
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: config.cookieSameSite,
  path: "/"
};
function setAuthCookies(res, accessToken, refreshToken, refreshExpiresAt) {
  res.cookie(config.accessCookieName, accessToken, { ...cookieBase, maxAge: 15 * 60 * 1000 });
  res.cookie(config.refreshCookieName, refreshToken, { ...cookieBase, expires: refreshExpiresAt });
}
function clearAuthCookies(res) {
  res.clearCookie(config.accessCookieName, cookieBase);
  res.clearCookie(config.refreshCookieName, cookieBase);
}

export const register = asyncHandler(async (req, res) => {
  const schema = z.object({
    fullName: z.string().trim().min(2).max(120),
    loginId: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/),
    email: z.string().trim().email().max(254),
    password: z.string().min(12).max(128)
  });
  const payload = schema.parse(req.body);
  const user = await authService.registerUser(payload, req);
  return success(res, "Registration received. Check your email for verification. Admin approval is required after verification.", { user }, 201);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await verificationService.verifyEmail(req.body.token);
  return success(res, "Email verified. Your account is awaiting Admin approval.", result);
});

export const resendVerification = asyncHandler(async (req, res) => {
  await verificationService.resendVerification(req.body.email);
  return success(res, "If the account exists and needs verification, a verification email will be sent.");
});

export const login = asyncHandler(async (req, res) => {
  const schema = z.object({ loginId: z.string().min(1), password: z.string().min(1) });
  const result = await authService.loginUser(schema.parse(req.body), req);
  setAuthCookies(res, result.accessToken, result.refreshToken, result.refreshExpiresAt);
  return success(res, "Login successful.", { user: result.user });
});

export const refresh = asyncHandler(async (req, res) => {
  const raw = req.cookies[config.refreshCookieName];
  const { user, refresh: next } = await rotateRefreshSession(raw, req);
  const accessToken = (await import("../services/sessionService.js")).createAccessToken(user);
  setAuthCookies(res, accessToken, next.rawToken, next.expiresAt);
  return success(res, "Session refreshed.");
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.cookies[config.refreshCookieName], req);
  clearAuthCookies(res);
  return success(res, "Logged out successfully.");
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const schema = z.object({ email: z.string().trim().email().max(254) });
  await resetService.requestPasswordReset(schema.parse(req.body).email);
  return success(res, "If an eligible account exists, password reset instructions will be sent.");
});

export const resetPassword = asyncHandler(async (req, res) => {
  const schema = z.object({ token: z.string().min(20), newPassword: z.string().min(12).max(128) });
  const body = schema.parse(req.body);
  await resetService.resetPassword(body.token, body.newPassword);
  clearAuthCookies(res);
  return success(res, "Password reset successfully. Please log in again.");
});

export const me = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required.", 401, "AUTH_REQUIRED");
  const user = await authService.getCurrentUser(req.user);
  return success(res, "Current user retrieved.", { user });
});
