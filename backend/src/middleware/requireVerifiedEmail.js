import AppError from "../utils/AppError.js";

export function requireVerifiedEmail(req, _res, next) {
  if (!req.user?.emailVerifiedAt) return next(new AppError("Email verification required.", 403, "EMAIL_NOT_VERIFIED"));
  next();
}
