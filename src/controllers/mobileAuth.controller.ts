import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const mobileAuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.registerMobile(req.body as any);
    sendSuccess(res, { statusCode: 201, message: "Registration successful. Verify the email with the OTP sent.", data: result });
  }),

  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body as { email: string; otp: string };
    const result = await authService.verifyEmailOtp(email, otp);
    sendSuccess(res, { message: "Email verified successfully.", data: result });
  }),

  resendOtp: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };
    const result = await authService.resendEmailOtp(email);
    sendSuccess(res, { message: "If an account exists, an OTP has been sent.", data: result });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.loginMobile(req.body as any);
    sendSuccess(res, { message: "Login successful.", data: result });
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body as any);
    sendSuccess(res, {
      message: "If an account with that email exists, a password reset token has been generated.",
      data: result.resetToken ? { resetToken: result.resetToken } : undefined,
    });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body as any);
    sendSuccess(res, { message: "Password reset successfully. Please log in with your new password." });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.body?.refreshToken as string | undefined);
    sendSuccess(res, { message: "Logged out successfully." });
  }),

  submitId: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new Error("Authentication required.");
    const { photoUrl } = req.body as { photoUrl: string };
    await authService.submitIdVerification(req.user.id, photoUrl);
    sendSuccess(res, { message: "ID submitted successfully. Your account is pending review." });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new Error("Authentication required.");
    const user = await authService.getMe(req.user.id);
    sendSuccess(res, { message: "Current user retrieved successfully.", data: user });
  }),
};