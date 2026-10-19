import { z } from "zod";
import { LEAD_STATUSES } from "../models/Lead.js";
const optionalText = (max) => z.string().trim().max(max).optional();
export const createLeadSchema = z.object({
  displayName: z.string().trim().min(1).max(200),
  firstName: optionalText(100), lastName: optionalText(100),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  phone: optionalText(40), company: optionalText(200), source: optionalText(100),
  status: z.enum(LEAD_STATUSES).optional(), priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
  ownerId: z.string().regex(/^[a-f\d]{24}$/i).optional(), description: optionalText(5000),
  customFields: z.record(z.string(), z.unknown()).optional()
}).strict();
export const updateLeadSchema = createLeadSchema.partial().extend({ lostReason: optionalText(1000) }).strict();
export const assignLeadSchema = z.object({ ownerId: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(), reason: optionalText(500) }).strict();
export const noteSchema = z.object({ note: z.string().trim().min(1).max(3000) }).strict();
