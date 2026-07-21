import type { Server } from "socket.io";
import { SOCKET_CONSTANTS } from "../constants/socket.constants";

/**
 * Most of this app's real-time pushes happen from inside a socket event
 * handler, which already has `io` in scope. Notifications are different:
 * they're often created from a plain REST request (e.g. `POST /sessions`
 * creating a SESSION_REQUEST notification) that has no socket in scope at
 * all. Rather than thread `io` as a parameter through every service
 * function that might eventually need it, this module holds one shared
 * reference, set once at startup (`sockets/index.ts`) and read anywhere.
 *
 * `emitToUser` is a safe no-op if the socket server hasn't been initialized
 * yet — notably during tests, where nothing calls `setSocketServer` at all.
 */
let ioInstance: Server | null = null;

export function setSocketServer(io: Server): void {
  ioInstance = io;
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  ioInstance?.to(SOCKET_CONSTANTS.userRoom(userId)).emit(event, payload);
}
