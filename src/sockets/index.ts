import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { socketAuthMiddleware } from "./socketAuth.middleware";
import { onlineUsersRegistry } from "./onlineUsers.registry";
import { registerChatHandlers } from "./chatSocket.handlers";
import { SOCKET_CONSTANTS } from "../constants/socket.constants";
import { setSocketServer } from "./socketEmitter";
import type { AuthenticatedSocket } from "./socketAuth.middleware";

/**
 * Attaches Socket.IO to the existing HTTP server (so it shares the same
 * port as the REST API — no separate WebSocket server/port to manage) and
 * wires up auth, presence tracking, and the chat event handlers.
 */
export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins,
      credentials: true,
    },
  });

  // Lets REST-triggered code (e.g. session.service creating a notification
  // from a plain HTTP request) push real-time events too — see socketEmitter.ts.
  setSocketServer(io);

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const { userId } = (socket as AuthenticatedSocket).data;

    const justCameOnline = onlineUsersRegistry.addConnection(userId, socket.id);
    socket.join(SOCKET_CONSTANTS.userRoom(userId));
    logger.info(`Socket connected: user=${userId} socket=${socket.id}`);

    if (justCameOnline) {
      io.emit("presence:update", { userId, isOnline: true });
    }

    registerChatHandlers(io, socket);

    socket.on("disconnect", () => {
      const wentOffline = onlineUsersRegistry.removeConnection(userId, socket.id);
      logger.info(`Socket disconnected: user=${userId} socket=${socket.id}`);
      if (wentOffline) {
        io.emit("presence:update", { userId, isOnline: false });
      }
    });
  });

  return io;
}
