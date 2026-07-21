import { z } from "zod";
import { PASSWORD_POLICY_MESSAGE, STRONG_PASSWORD_REGEX } from "../constants/auth.constants";

const strongPassword = z
  .string()
  .min(8, PASSWORD_POLICY_MESSAGE)
  .regex(STRONG_PASSWORD_REGEX, PASSWORD_POLICY_MESSAGE);

const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(50, `${label} must be at most 50 characters`);

export const registerSchema = z
  .object({
    firstName: nameField("First name"),
    lastName: nameField("Last name"),
    email: z.string().trim().toLowerCase().email("Must be a valid email address"),
    password: strongPassword,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

// Mobile registration schema — accepts fullName and university-related fields
export const mobileRegisterSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
    email: z.string().trim().toLowerCase().email("Must be a valid email address"),
    password: strongPassword,
    confirmPassword: z.string().min(1, "Confirm password is required"),
    university: z.string().trim().min(2, "University is required"),
    department: z.string().trim().optional(),
    level: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type MobileRegisterInput = z.infer<typeof mobileRegisterSchema>;

export const mobileVerifySchema = z.object({
  email: z.string().trim().toLowerCase().email("Must be a valid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});
export type MobileVerifyInput = z.infer<typeof mobileVerifySchema>;

export const resendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Must be a valid email address"),
});
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;

export const submitIdSchema = z.object({
  photoUrl: z.string().trim().url("Must be a valid URL pointing to the uploaded ID photo"),
});
export type SubmitIdInput = z.infer<typeof submitIdSchema>;
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Must be a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});
export type LogoutInput = z.infer<typeof logoutSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Must be a valid email address"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: strongPassword,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: strongPassword,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
