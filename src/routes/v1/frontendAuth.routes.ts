/**
 * Frontend Auth Routes — All 11 endpoints from the API spec
 * Base path: /auth/*
 */

import { Router } from "express";
import { frontendAuthController } from "../../controllers/frontendAuth.controller";
import { authenticate } from "../../middlewares/authenticate";
import { uploadProfilePhoto, uploadIdPhoto } from "../../middlewares/upload.middleware";
import { ApiError } from "../../utils/ApiError";
import type { NextFunction, Request, Response } from "express";

export const frontendAuthRouter = Router();

/**
 * 1. POST /auth/register
 * Create new student account + send OTP
 */
frontendAuthRouter.post("/auth/register", frontendAuthController.register);

/**
 * 2. POST /auth/send-otp
 * Resend 6-digit verification OTP
 */
frontendAuthRouter.post("/auth/send-otp", frontendAuthController.sendOtp);

/**
 * 3. POST /auth/verify-otp
 * Verify OTP + create user + return token
 */
frontendAuthRouter.post("/auth/verify-otp", frontendAuthController.verifyOtp);

/**
 * 4. POST /auth/login
 * Email + password login
 */
frontendAuthRouter.post("/auth/login", frontendAuthController.login);

/**
 * 5. GET /auth/me
 * Get current user profile
 */
frontendAuthRouter.get("/auth/me", authenticate, frontendAuthController.getMe);

/**
 * 6. POST /auth/logout
 * Logout + revoke token
 */
frontendAuthRouter.post("/auth/logout", authenticate, frontendAuthController.logout);

/**
 * 7. PUT /auth/profile
 * Save profile/university/skills + advance setupProgress
 */
frontendAuthRouter.put("/auth/profile", authenticate, uploadProfilePhoto, frontendAuthController.saveProfile);

/**
 * 8. POST /auth/verify-id
 * Submit student ID photo + advance setupProgress
 */
frontendAuthRouter.post("/auth/verify-id", authenticate, uploadIdPhoto, frontendAuthController.verifyId);

/**
 * 9. POST /auth/forgot-password
 * Send password reset OTP
 */
frontendAuthRouter.post("/auth/forgot-password", frontendAuthController.forgotPassword);

/**
 * 10. POST /auth/reset-password
 * Reset password with OTP
 */
frontendAuthRouter.post("/auth/reset-password", frontendAuthController.resetPassword);

/**
 * 11. PATCH /auth/user
 * Partial profile update
 */
frontendAuthRouter.patch("/auth/user", authenticate, frontendAuthController.updateUser);

/**
 * Frontend auth error handler — strips the global { success: false } wrapper
 * so responses match the mobile API spec: { message: "..." }
 */
frontendAuthRouter.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  return next(err);
});
