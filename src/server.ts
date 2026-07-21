import http from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { createSocketServer } from "./sockets";

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();

  // Socket.IO needs the raw HTTP server (not the Express app) to attach to,
  // so the WebSocket upgrade and the REST API share the same port.
  const httpServer = http.createServer(app);
  createSocketServer(httpServer);

  const server = httpServer.listen(env.PORT, () => {
    logger.info(`🚀 PeerConnect API running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`📚 API docs available at http://localhost:${env.PORT}/api-docs`);
    logger.info(`💬 Socket.IO chat server attached to the same port`);
  });

  const shutdown = async (signal: string) => {
    logger.warn(`${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info("Shutdown complete.");
      process.exit(0);
    });

    // Force-exit if graceful shutdown hangs
    setTimeout(() => {
      logger.error("Forced shutdown after timeout.");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection:", reason);
  });

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception:", error);
    process.exit(1);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
