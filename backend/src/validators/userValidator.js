import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  loginId: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128)
});

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(254).optional()
}).refine((v) => Object.keys(v).length > 0, "At least one field is required");

export const statusSchema = z.object({ status: z.enum(["active", "inactive"]) });
export const permissionsSchema = z.object({ permissions: z.array(z.string().min(1)).max(200) });
