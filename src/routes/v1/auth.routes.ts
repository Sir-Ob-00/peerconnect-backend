import { Router } from "express";
import { authController } from "../../controllers/auth.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { authenticate } from "../../middlewares/authenticate";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
} from "../../validators/auth.validator";

export const authRouter = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new student account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, confirmPassword]
 *             properties:
 *               firstName: { type: string, example: Ama }
 *               lastName: { type: string, example: Mensah }
 *               email: { type: string, format: email, example: ama.mensah@st.university.edu.gh }
 *               password: { type: string, format: password, example: StrongPass1! }
 *               confirmPassword: { type: string, format: password, example: StrongPass1! }
 *     responses:
 *       201:
 *         description: Registration successful — returns the new user and a token pair.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user: { $ref: '#/components/schemas/User' }
 *                         accessToken: { type: string }
 *                         refreshToken: { type: string }
 *       409:
 *         description: Email is already registered.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422:
 *         description: Validation failed (weak password, mismatched confirmation, etc).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
authRouter.post("/auth/register", validateRequest({ body: registerSchema }), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: ama.mensah@st.university.edu.gh }
 *               password: { type: string, format: password, example: StrongPass1! }
 *     responses:
 *       200:
 *         description: Login successful — returns the user and a token pair.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user: { $ref: '#/components/schemas/User' }
 *                         accessToken: { type: string }
 *                         refreshToken: { type: string }
 *       401:
 *         description: Invalid email or password.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Account is suspended, inactive, or deleted.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
authRouter.post("/auth/login", validateRequest({ body: loginSchema }), authController.login);

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
 * /auth/logout:
 *   post:
 *     summary: Log out (revokes the given refresh token if provided)
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Always succeeds — the client should discard its stored tokens regardless.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 */
authRouter.post("/auth/logout", validateRequest({ body: logoutSchema }), authController.logout);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset token
 *     description: >
 *       Development-phase behavior: if the email belongs to an active account, a reset token is
 *       generated and returned directly in the response body under `data.resetToken` so the flow
 *       is testable without an email provider. This will be replaced by an emailed link/OTP later
 *       without changing this endpoint's contract for the happy path.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: >
 *           Always returns success (whether or not the email exists), to avoid confirming which
 *           emails are registered. `data` is only present when a token was actually generated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 */
authRouter.post(
  "/auth/forgot-password",
  validateRequest({ body: forgotPasswordSchema }),
  authController.forgotPassword
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset a password using a token from /auth/forgot-password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password, confirmPassword]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, format: password, example: NewStrongPass1! }
 *               confirmPassword: { type: string, format: password, example: NewStrongPass1! }
 *     responses:
 *       200:
 *         description: Password reset. All existing sessions are invalidated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400:
 *         description: Token is invalid, expired, or already used.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
authRouter.post(
  "/auth/reset-password",
  validateRequest({ body: resetPasswordSchema }),
  authController.resetPassword
);

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

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The authenticated user's profile.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Not authenticated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
authRouter.get("/auth/me", authenticate, authController.getMe);
