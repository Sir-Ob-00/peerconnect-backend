import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput,
} from "../validators/auth.validator";

export const authController = {
  register: asyncHandler(async (req: Request<unknown, unknown, RegisterInput>, res: Response) => {
    const result = await authService.register(req.body);
    sendSuccess(res, { statusCode: 201, message: "Registration successful.", data: result });
  }),

  login: asyncHandler(async (req: Request<unknown, unknown, LoginInput>, res: Response) => {
    const result = await authService.login(req.body);
    sendSuccess(res, { message: "Login successful.", data: result });
  }),

  refresh: asyncHandler(async (req: Request<unknown, unknown, RefreshTokenInput>, res: Response) => {
    const tokens = await authService.refresh(req.body.refreshToken);
    sendSuccess(res, { message: "Access token refreshed successfully.", data: tokens });
  }),

  logout: asyncHandler(async (req: Request<unknown, unknown, { refreshToken?: string }>, res: Response) => {
    await authService.logout(req.body?.refreshToken);
    sendSuccess(res, { message: "Logged out successfully." });
  }),

  forgotPassword: asyncHandler(async (req: Request<unknown, unknown, ForgotPasswordInput>, res: Response) => {
    const result = await authService.forgotPassword(req.body);
    sendSuccess(res, {
      message: "If an account with that email exists, a password reset token has been generated.",
      data: result.resetToken ? { resetToken: result.resetToken } : undefined,
    });
  }),

  resetPassword: asyncHandler(async (req: Request<unknown, unknown, ResetPasswordInput>, res: Response) => {
    await authService.resetPassword(req.body);
    sendSuccess(res, { message: "Password reset successfully. Please log in with your new password." });
  }),

  changePassword: asyncHandler(async (req: Request<unknown, unknown, ChangePasswordInput>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    await authService.changePassword(req.user.id, req.body);
    sendSuccess(res, { message: "Password changed successfully. Please log in again on other devices." });
  }),

  getMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const user = await authService.getMe(req.user.id);
    sendSuccess(res, { message: "Current user retrieved successfully.", data: user });
  }),
};
