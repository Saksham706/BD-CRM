import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/apiResponse.js";
import {
  listLeads,
  createLead,
  updateLead,
  assignLead,
  getLeadDetails,
  archiveLead,
} from "../services/leadService.js";
import Activity from "../models/Activity.js";
import AppError from "../utils/AppError.js";
export const list = asyncHandler(async (req, res) =>
  success(
    res,
    "Leads retrieved",
    await listLeads({ user: req.user, query: req.query }),
  ),
);
export const create = asyncHandler(async (req, res) =>
  success(res, "Lead created", await createLead({ req, data: req.body }), 201),
);
export const details = asyncHandler(async (req, res) =>
  success(
    res,
    "Lead details retrieved",
    await getLeadDetails({ id: req.params.id, user: req.user }),
  ),
);
export const update = asyncHandler(async (req, res) =>
  success(
    res,
    "Lead updated",
    await updateLead({ req, id: req.params.id, data: req.body }),
  ),
);
export const assign = asyncHandler(async (req, res) =>
  success(
    res,
    "Lead assigned",
    await assignLead({
      req,
      id: req.params.id,
      ownerId: req.body.ownerId || null,
      reason: req.body.reason || "",
    }),
  ),
);
export const archive = asyncHandler(async (req, res) =>
  success(res, "Lead archived", await archiveLead({ req, id: req.params.id })),
);
export const addNote = asyncHandler(async (req, res) => {
  const { findAccessibleLead } = await import("../services/leadService.js");
  const lead = await findAccessibleLead(req.params.id, req.user);
  const text = String(req.body.note || "").trim();
  if (!text || text.length > 3000)
    throw new AppError(
      "Note must contain 1–3000 characters.",
      400,
      "INVALID_NOTE",
    );
  const activity = await Activity.create({
    leadId: lead._id,
    actorId: req.user._id,
    eventType: "lead.note_added",
    summary: text,
    payload: { note: text },
  });
  return success(res, "Note added", activity, 201);
});
