import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadDotenv();

/**
 * All environment variables the app depends on are validated once, at
 * startup, so a missing/malformed value fails fast with a clear message
 * instead of surfacing as a confusing runtime error later.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().optional(),
  API_VERSION: z.string().default("v1"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CORS_ORIGIN: z.string().default("*"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  LOG_LEVEL: z.enum(["error", "warn", "info", "http", "debug"]).default("debug"),

  // Auth
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("24h"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  JWT_REFRESH_EXPIRES_IN_MS: z.coerce.number().int().positive().default(7 * 24 * 60 * 60 * 1000),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  PASSWORD_RESET_TOKEN_EXPIRES_IN_MINUTES: z.coerce.number().int().positive().default(30),

  // University domains allowed for student registration (comma-separated)
  ALLOWED_UNIVERSITY_DOMAINS: z.string().default("") ,

  // Email OTP settings
  OTP_EXPIRES_MINUTES: z.coerce.number().int().positive().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),

  // Login-specific rate limiting (brute-force protection)
  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  LOGIN_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(10),

  // Cloudinary (Phase 3 — profile photo upload)
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default("peerconnect/profile-photos"),
  MAX_PROFILE_PHOTO_SIZE_MB: z.coerce.number().positive().default(5),
  CLOUDINARY_CHAT_UPLOAD_FOLDER: z.string().default("peerconnect/chat-images"),
  MAX_CHAT_IMAGE_SIZE_MB: z.coerce.number().positive().default(5),
  CLOUDINARY_ID_UPLOAD_FOLDER: z.string().default("peerconnect/id-verifications"),
  MAX_ID_PHOTO_SIZE_MB: z.coerce.number().positive().default(5),

  // Email (Phase 8 — Nodemailer)
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .string()
    .default("false")
    .transform((val) => val.toLowerCase() === "true"),
  SMTP_USER: z.string().min(1, "SMTP_USER is required"),
  SMTP_PASSWORD: z.string().min(1, "SMTP_PASSWORD is required"),
  EMAIL_FROM: z.string().min(1, "EMAIL_FROM is required").default("PeerConnect <no-reply@peerconnect.app>"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables. Check your .env file against .env.example.");
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
  isDevelopment: parsed.data.NODE_ENV === "development",
  isTest: parsed.data.NODE_ENV === "test",
  corsOrigins:
    parsed.data.CORS_ORIGIN === "*" ? "*" : parsed.data.CORS_ORIGIN.split(",").map((o) => o.trim()),
};
