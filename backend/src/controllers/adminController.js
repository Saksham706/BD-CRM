import { z } from "zod";
import { success } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as adminService from "../services/adminService.js";

export const pendingUsers = asyncHandler(async (_req, res) =>
  success(res, "Pending users retrieved.", { users: await adminService.listPendingUsers() })
);

export const approveUser = asyncHandler(async (req, res) => {
  const user = await adminService.approveUser(req.params.id, req.user, req);
  return success(res, "User approved.", { user: {
    id: String(user._id), fullName: user.fullName, loginId: user.loginId,
    email: user.email, approvalStatus: user.approvalStatus
  } });
});

export const rejectUser = asyncHandler(async (req, res) => {
  const { reason } = z.object({ reason: z.string().trim().max(500).optional() }).parse(req.body);
  const user = await adminService.rejectUser(req.params.id, reason, req.user, req);
  return success(res, "User registration rejected.", { user: {
    id: String(user._id), loginId: user.loginId, approvalStatus: user.approvalStatus
  } });
});
