import { getUserPermissionKeys } from "../services/permissionService.js";
import AppError from "../utils/AppError.js";

export function requirePermission(permissionKey) {
  return async (req, _res, next) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401, "AUTH_REQUIRED");
      if (req.user.accountType === "admin") return next();
      if (!req.user.emailVerifiedAt) throw new AppError("Email verification required.", 403, "EMAIL_NOT_VERIFIED");
      if (req.user.approvalStatus !== "approved") throw new AppError("Admin approval is required.", 403, "ADMIN_APPROVAL_REQUIRED");
      const permissions = await getUserPermissionKeys(req.user);
      if (!permissions.includes(permissionKey)) throw new AppError("You do not have permission to perform this action.", 403, "PERMISSION_DENIED");
      next();
    } catch (error) {
      next(error);
    }
  };
}
