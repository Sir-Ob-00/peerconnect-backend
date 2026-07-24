import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import type { Role } from "@prisma/client";

export interface AccessTokenPayload {
  sub: string; // user id
  role: Role;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string; // user id
  /** Ties this JWT to a specific stored RefreshToken row, so it can be revoked individually. */
  jti: string;
  type: "refresh";
}

export function signAccessToken(payload: { userId: string; role: Role }, expiresIn?: string): string {
  const body: AccessTokenPayload = { sub: payload.userId, role: payload.role, type: "access" };
  return jwt.sign(body, env.JWT_ACCESS_SECRET, {
    expiresIn: expiresIn ?? env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

export function signRefreshToken(payload: { userId: string; tokenId: string }): string {
  const body: RefreshTokenPayload = { sub: payload.userId, jti: payload.tokenId, type: "refresh" };
  return jwt.sign(body, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

/** Throws a jsonwebtoken error (TokenExpiredError / JsonWebTokenError) on failure — callers should catch it. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  if (decoded.type !== "access") {
    throw new jwt.JsonWebTokenError("Not an access token");
  }
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  if (decoded.type !== "refresh") {
    throw new jwt.JsonWebTokenError("Not a refresh token");
  }
  return decoded;
}
