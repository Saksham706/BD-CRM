import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/apiResponse.js";
import {
  listLeadFields,
  createLeadField,
  updateLeadField,
} from "../services/leadFieldService.js";
export const list = asyncHandler(async (req, res) =>
  success(res, "Lead fields retrieved", await listLeadFields()),
);
export const create = asyncHandler(async (req, res) =>
  success(res, "Lead field created", await createLeadField(req, req.body), 201),
);
export const update = asyncHandler(async (req, res) =>
  success(
    res,
    "Lead field updated",
    await updateLeadField(req, req.params.id, req.body),
  ),
);
