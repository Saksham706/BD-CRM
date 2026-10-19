import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/apiResponse.js";
import {
  listLeadSources,
  createLeadSource,
  updateLeadSource,
} from "../services/leadSourceService.js";
export const list = asyncHandler(async (req, res) =>
  success(res, "Lead sources retrieved", await listLeadSources()),
);
export const create = asyncHandler(async (req, res) =>
  success(
    res,
    "Lead source created",
    await createLeadSource(req, req.body),
    201,
  ),
);
export const update = asyncHandler(async (req, res) =>
  success(
    res,
    "Lead source updated",
    await updateLeadSource(req, req.params.id, req.body),
  ),
);
