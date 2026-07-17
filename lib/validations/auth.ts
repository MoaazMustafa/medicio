import { z } from "zod";
import { UserRole } from "@prisma/client";

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name must be at most 50 characters long." })
    .trim(),
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." })
    .max(100, { message: "Password must be at most 100 characters long." }),
  role: z.nativeEnum(UserRole, {
    message: "Please select a valid account role.",
  }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(1, { message: "Password is required." }),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .trim()
    .toLowerCase(),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .trim()
    .toLowerCase(),
  otp: z
    .string()
    .length(6, { message: "Verification code must be exactly 6 characters long." })
    .regex(/^\d+$/, { message: "Verification code must contain digits only." }),
  newPassword: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." })
    .max(100, { message: "Password must be at most 100 characters long." }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
