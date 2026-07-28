import { UserRole } from "@prisma/client";
import { z } from "zod";

export const updateUserSchema = z
  .object({
    role: z
      .nativeEnum(UserRole, { message: "Please provide a valid role." })
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.role !== undefined || data.isActive !== undefined, {
    message: "Provide at least one field to update (role or isActive).",
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
