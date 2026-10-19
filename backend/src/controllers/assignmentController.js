import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/apiResponse.js";
import Assignment from "../models/Assignment.js";
import { findAccessibleLead } from "../services/leadService.js";
export const history = asyncHandler(async (req, res) => {
  const lead = await findAccessibleLead(req.params.leadId, req.user);
  const items = await Assignment.find({ leadId: lead._id })
    .sort({ createdAt: -1 })
    .populate("oldOwnerId newOwnerId actorId", "fullName loginId email")
    .lean();
  return success(res, "Assignment history retrieved", items);
});
