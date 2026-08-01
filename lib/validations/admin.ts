import { z } from "zod";

export const updateUserSchema = z
  .object({
    role: z.string().min(1, "Please provide a valid role.").optional(),
    name: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
    isVerified: z.boolean().optional(),
  })
  .refine((data) => data.role !== undefined || data.isActive !== undefined || data.name !== undefined || data.isVerified !== undefined, {
    message: "Provide at least one field to update (role, name, isActive, or isVerified).",
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
