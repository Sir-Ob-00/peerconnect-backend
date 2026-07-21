import rateLimit from "express-rate-limit";
import { env } from "../config/env";

/**
 * Global rate limiter applied to all /api routes. Kept generous by default
 * (see .env.example) — tighter, endpoint-specific limits (e.g. login
 * brute-force protection) can be layered on top in later phases.
 */
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});
