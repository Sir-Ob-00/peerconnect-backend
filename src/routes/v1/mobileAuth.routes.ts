import { Router } from "express";
import { mobileAuthController } from "../../controllers/mobileAuth.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { authenticate } from "../../middlewares/authenticate";
import {
  mobileRegisterSchema,
  mobileVerifySchema,
  resendOtpSchema,
  submitIdSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  logoutSchema,
} from "../../validators/auth.validator";

export const mobileAuthRouter = Router();

// POST /mobile/auth/register
mobileAuthRouter.post("/auth/register", validateRequest({ body: mobileRegisterSchema }), mobileAuthController.register);

// POST /mobile/auth/verify-email
mobileAuthRouter.post("/auth/verify-email", validateRequest({ body: mobileVerifySchema }), mobileAuthController.verifyEmail);

// POST /mobile/auth/resend-otp
mobileAuthRouter.post("/auth/resend-otp", validateRequest({ body: resendOtpSchema }), mobileAuthController.resendOtp);

// POST /mobile/auth/login
import { loginRateLimiter, otpRateLimiter } from "../../middlewares/loginRateLimiter";

mobileAuthRouter.post("/auth/login", loginRateLimiter, validateRequest({ body: loginSchema }), mobileAuthController.login);
// protect verify & resend endpoints
mobileAuthRouter.post("/auth/verify-email", otpRateLimiter, validateRequest({ body: mobileVerifySchema }), mobileAuthController.verifyEmail);
mobileAuthRouter.post("/auth/resend-otp", otpRateLimiter, validateRequest({ body: resendOtpSchema }), mobileAuthController.resendOtp);

// POST /mobile/auth/forgot-password
mobileAuthRouter.post("/auth/forgot-password", validateRequest({ body: forgotPasswordSchema }), mobileAuthController.forgotPassword);

// POST /mobile/auth/reset-password
mobileAuthRouter.post("/auth/reset-password", validateRequest({ body: resetPasswordSchema }), mobileAuthController.resetPassword);

// POST /mobile/auth/logout
mobileAuthRouter.post("/auth/logout", validateRequest({ body: logoutSchema }), mobileAuthController.logout);

// POST /mobile/auth/submit-id
mobileAuthRouter.post("/auth/submit-id", authenticate, validateRequest({ body: submitIdSchema }), mobileAuthController.submitId);

// GET /mobile/auth/me
mobileAuthRouter.get("/auth/me", authenticate, mobileAuthController.me);
