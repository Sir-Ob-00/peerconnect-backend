import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authService } from "../../services/auth.service";
import { sendSuccess } from "../../utils/ApiResponse";
import { validateRequest } from "../../middlewares/validateRequest";
import { loginSchema } from "../../validators/auth.validator";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { loginRateLimiter } from "../../middlewares/loginRateLimiter";

export const adminAuthRouter = Router();

// POST /admin/auth/login
adminAuthRouter.post(
  "/auth/login",
  loginRateLimiter,
  validateRequest({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const result = await authService.loginAdmin(req.body);
    sendSuccess(res, { message: "Admin login successful.", data: result });
  })
);

// POST /admin/auth/logout
adminAuthRouter.post(
  "/auth/logout",
  asyncHandler(async (req, res) => {
    await authService.logout(req.body?.refreshToken as string | undefined);
    sendSuccess(res, { message: "Logged out successfully." });
  })
);

// GET /admin/auth/me
adminAuthRouter.get(
  "/auth/me",
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new Error("Authentication required.");
    const user = await authService.getMe(req.user.id);
    sendSuccess(res, { message: "Current admin retrieved successfully.", data: user });
  })
);
