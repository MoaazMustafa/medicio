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

export const updateSpecialistAgentSchema = z
  .object({
    displayName: z.string().min(1).max(80).optional(),
    description: z.string().min(1).max(200).optional(),
    trainingData: z.string().max(20000).nullable().optional(),
    suggestedQuestions: z.array(z.string().min(1).max(300)).max(12).optional(),
    attachedDoctorIds: z.array(z.string().min(1)).max(50).optional(),
    isEnabled: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Provide at least one field to update.",
  });

export type UpdateSpecialistAgentInput = z.infer<typeof updateSpecialistAgentSchema>;

export const adminDoctorTrainingSchema = z.object({
  agentName: z.string().max(120).optional(),
  agentTone: z.string().max(120).optional(),
  emergencyRedFlags: z.array(z.string().min(1).max(300)).max(20).optional(),
  intakeProtocols: z.string().max(5000).optional(),
  practiceBoundaries: z.string().max(5000).optional(),
  customDisclaimer: z.string().max(1000).optional(),
  triageAdviceRules: z.string().max(5000).optional(),
  isTrained: z.boolean().optional(),
});

export type AdminDoctorTrainingInput = z.infer<typeof adminDoctorTrainingSchema>;
