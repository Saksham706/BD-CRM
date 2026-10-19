import AppError from "../utils/AppError.js";

export function requireApprovedAccount(req, _res, next) {
  if (req.user?.accountType === "admin") return next();
  if (req.user?.approvalStatus !== "approved") {
    return next(new AppError("Admin approval is required.", 403, "ADMIN_APPROVAL_REQUIRED"));
  }
  next();
}
