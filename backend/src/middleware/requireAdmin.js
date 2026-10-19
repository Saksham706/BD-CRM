import AppError from "../utils/AppError.js";

export function requireAdmin(req, _res, next) {
  if (!req.user || req.user.accountType !== "admin") {
    return next(new AppError("Administrator access required.", 403, "ADMIN_REQUIRED"));
  }
  next();
}
