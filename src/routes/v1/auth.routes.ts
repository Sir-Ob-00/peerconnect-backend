import { Router } from "express";
import { authController } from "../../controllers/auth.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { authenticate } from "../../middlewares/authenticate";
import {
  changePasswordSchema,
  refreshTokenSchema,
} from "../../validators/auth.validator";

export const authRouter = Router();

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Exchange a valid refresh token for a new access + refresh token pair
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: New token pair issued. The old refresh token is now invalid (rotation).
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/AuthTokens' }
 *       401:
 *         description: Refresh token is invalid, expired, revoked, or reused.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
authRouter.post("/auth/refresh", validateRequest({ body: refreshTokenSchema }), authController.refresh);

/**
 * @openapi
 * /auth/change-password:
 *   patch:
 *     summary: Change the current user's password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword, confirmPassword]
 *             properties:
 *               currentPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password, example: NewStrongPass1! }
 *               confirmPassword: { type: string, format: password, example: NewStrongPass1! }
 *     responses:
 *       200:
 *         description: Password changed. All existing sessions are invalidated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401:
 *         description: Not authenticated, or current password is incorrect.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
authRouter.patch(
  "/auth/change-password",
  authenticate,
  validateRequest({ body: changePasswordSchema }),
  authController.changePassword
);
