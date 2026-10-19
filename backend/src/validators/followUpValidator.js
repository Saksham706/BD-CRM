import { z } from "zod";
export const createFollowupSchema = z.object({
  leadId: z.string().regex(/^[a-f\d]{24}$/i),
  ownerId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  dueAt: z.string().datetime({ offset: true }),
  type: z.enum(["Call", "Email", "Meeting", "WhatsApp", "Task", "Other"]).optional(),
  remark: z.string().max(3000).optional(),
  reminderMinutes: z.array(z.number().int().min(0).max(10080)).max(5).optional()
}).strict();
export const completeFollowupSchema = z.object({ remark: z.string().trim().max(3000).optional() }).strict();
export const rescheduleFollowupSchema = z.object({ dueAt: z.string().datetime({ offset: true }), reason: z.string().trim().max(500).optional() }).strict();
export const cancelFollowupSchema = z.object({ reason: z.string().trim().max(500).optional() }).strict();
