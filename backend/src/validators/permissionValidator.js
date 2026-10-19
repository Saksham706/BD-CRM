import { z } from "zod";
export const assignPermissionsSchema = z.object({
  permissions: z.array(z.string().min(1)).max(200)
});
