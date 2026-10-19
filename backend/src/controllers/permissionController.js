import { success } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPermissionCatalog } from "../services/permissionService.js";

export const listPermissions = asyncHandler(async (_req, res) =>
  success(res, "Permission catalog retrieved.", { permissions: await getPermissionCatalog() })
);
