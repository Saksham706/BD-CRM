import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/apiResponse.js";
import { getDashboard } from "../services/dashboardService.js";
export const summary = asyncHandler(async (req, res) =>
  success(
    res,
    "Dashboard summary retrieved",
    await getDashboard(req.user, req.query),
  ),
);
