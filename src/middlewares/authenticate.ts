import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "../utils/jwt.util";
import { ApiError } from "../utils/ApiError";
import { AUTH_CONSTANTS } from "../constants/auth.constants";

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith(AUTH_CONSTANTS.BEARER_PREFIX)) {
    return null;
  }
  const token = header.slice(AUTH_CONSTANTS.BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
}

/**
 * Requires a valid, non-expired access token. On success, attaches
 * `req.user = { id, role }` (see src/types/express/index.d.ts) for
 * downstream controllers/middleware to use.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    return next(ApiError.unauthorized("Authentication required. Provide a Bearer access token."));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized("Access token has expired."));
    }
    return next(ApiError.unauthorized("Invalid access token."));
  }
}

/**
 * Like `authenticate`, but never rejects the request — it just attaches
 * `req.user` when a valid token is present and moves on otherwise. Useful
 * for routes that behave differently for logged-in vs anonymous callers
 * without requiring auth outright.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    // Invalid/expired token on an optional-auth route: proceed as anonymous
    // rather than failing the request.
  }
  next();
}

/** Must run after `authenticate`. Rejects any caller whose role isn't ADMIN. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(ApiError.unauthorized("Authentication required."));
  }
  if (req.user.role !== "ADMIN") {
    return next(ApiError.forbidden("This action requires administrator privileges."));
  }
  next();
}

/** Must run after `authenticate`. Rejects any caller whose role isn't STUDENT. */
export async function requireStudent(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    return next(ApiError.unauthorized("Authentication required."));
  }
  if (req.user.role !== "STUDENT") {
    return next(ApiError.forbidden("This action requires a student account."));
  }

  // Ensure the student's email and student verification flags are present
  try {
    // lazy import repository to avoid cycles
    const { userRepository } = await import("../repositories/user.repository");
    const user = await userRepository.findActiveById(req.user.id);
    if (!user) return next(ApiError.unauthorized("Authentication required."));

    if (!user.isEmailVerified || !user.studentVerified) {
      // Allow access to some endpoints even if not fully verified: handled at route level.
      return next(ApiError.forbidden("Student account not fully verified."));
    }
    next();
  } catch (err) {
    return next(ApiError.internal());
  }
}
