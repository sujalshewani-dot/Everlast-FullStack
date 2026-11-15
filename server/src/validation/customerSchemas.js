import { z } from "zod";

export const customerEmailSchema = z.object({
  email: z.string().trim().email().max(254).toLowerCase(),
});

export const customerCodeSchema = customerEmailSchema.extend({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
});
