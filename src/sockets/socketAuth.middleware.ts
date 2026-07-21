import type { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "../utils/jwt.util";

export interface AuthenticatedSocketData {
  userId: string;
  role: string;
}

/** Socket with `data` narrowed to what `socketAuthMiddleware` guarantees is present after a successful handshake. */
export type AuthenticatedSocket = Socket & { data: AuthenticatedSocketData };

/**
 * Verifies the same access token used for REST requests, but read from the
 * Socket.IO handshake (`socket.handshake.auth.token`) instead of an
 * Authorization header — there's no separate "socket token" concept.
 * Rejecting here (`next(new Error(...))`) causes the client's `connect_error`
 * event to fire and the connection to never complete.
 */
export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): void {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    return next(new Error("Authentication required: no token provided."));
  }

  try {
    const payload = verifyAccessToken(token);
    (socket.data as AuthenticatedSocketData).userId = payload.sub;
    (socket.data as AuthenticatedSocketData).role = payload.role;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new Error("Access token has expired."));
    }
    return next(new Error("Invalid access token."));
  }
}
