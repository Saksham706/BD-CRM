import { z } from "zod";
import { success } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as userService from "../services/userService.js";
import * as adminService from "../services/adminService.js";
import * as permissionService from "../services/permissionService.js";

export const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.listUsers(req.query);
  return success(res, "Users retrieved.", result);
});

export const createUser = asyncHandler(async (req, res) => {
  const payload = z.object({
    fullName: z.string().trim().min(2).max(120),
    loginId: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/),
    email: z.string().trim().email().max(254),
    password: z.string().min(12).max(128)
  }).parse(req.body);
  const user = await userService.createUserByAdmin(payload, req.user, req);
  return success(res, "User created. Email verification is required before Admin approval.", {
    id: String(user._id), fullName: user.fullName, loginId: user.loginId, email: user.email
  }, 201);
});

export const updateUser = asyncHandler(async (req, res) => {
  const payload = z.object({
    fullName: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().max(254).optional()
  }).refine((v) => Object.keys(v).length > 0, "At least one field is required").parse(req.body);
  const user = await userService.updateUser(req.params.id, payload, req.user, req);
  return success(res, "User updated.", { user: {
    id: String(user._id), fullName: user.fullName, loginId: user.loginId,
    email: user.email, emailVerified: Boolean(user.emailVerifiedAt),
    approvalStatus: user.approvalStatus, accountStatus: user.accountStatus
  } });
});

export const setStatus = asyncHandler(async (req, res) => {
  const { status } = z.object({ status: z.enum(["active", "inactive"]) }).parse(req.body);
  const user = await userService.setAccountStatus(req.params.id, status, req.user, req);
  return success(res, "Account status updated.", { id: String(user._id), accountStatus: user.accountStatus });
});

export const setPermissions = asyncHandler(async (req, res) => {
  const { permissions } = z.object({ permissions: z.array(z.string().min(1)).max(200) }).parse(req.body);
  const result = await adminService.setUserPermissions(req.params.id, permissions, req.user, req);
  return success(res, "Permissions updated.", { userId: String(result.userId), permissions: result.permissions });
});

export const getPermissions = asyncHandler(async (req, res) => {
  const user = await (await import("../models/User.js")).default.findById(req.params.id).select("_id accountType");
  if (!user) return res.status(404).json({ success: false, message: "User not found." });
  const keys = await permissionService.getUserPermissionKeys(user);
  return success(res, "User permissions retrieved.", { userId: String(user._id), permissions: keys });
});
