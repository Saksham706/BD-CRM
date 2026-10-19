import Permission from "../models/Permission.js";
import UserPermission from "../models/UserPermission.js";
import { PERMISSIONS } from "../config/permissions.js";
import AppError from "../utils/AppError.js";

export async function seedPermissionDefinitions() {
  for (const permission of PERMISSIONS) {
    await Permission.updateOne({ key: permission.key }, { $set: permission }, { upsert: true });
  }
}

export async function getUserPermissionKeys(user) {
  if (user.accountType === "admin") return PERMISSIONS.map((p) => p.key);
  const record = await UserPermission.findOne({ userId: user._id }).lean();
  return record?.permissions || [];
}

export async function assignUserPermissions({ userId, permissions, actorId }) {
  if (!Array.isArray(permissions)) throw new AppError("Permissions must be an array.", 400, "INVALID_PERMISSIONS");
  const unique = [...new Set(permissions)];
  const known = new Set((await Permission.find({ key: { $in: unique }, active: true }).select("key").lean()).map((p) => p.key));
  const invalid = unique.filter((key) => !known.has(key));
  if (invalid.length) throw new AppError(`Unknown permissions: ${invalid.join(", ")}`, 400, "UNKNOWN_PERMISSION");
  return UserPermission.findOneAndUpdate(
    { userId },
    { $set: { permissions: unique, updatedBy: actorId } },
    { upsert: true, new: true, runValidators: true }
  );
}

export async function getPermissionCatalog() {
  return Permission.find({ active: true }).sort({ module: 1, action: 1 }).lean();
}
