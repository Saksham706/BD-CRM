import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  loginId: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128)
});

export const loginSchema = z.object({
  loginId: z.string().trim().min(1).max(50),
  password: z.string().min(1).max(128)
});

export const emailSchema = z.object({ email: z.string().trim().email().max(254) });
export const verifySchema = z.object({ token: z.string().min(20).max(200) });
export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  newPassword: z.string().min(12).max(128)
});
