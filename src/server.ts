import http from "http";
import os from "os";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { createSocketServer } from "./sockets";

function getLanIp(): string | null {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();

  const httpServer = http.createServer(app);
  createSocketServer(httpServer);

  const host = env.HOST?.trim();
  const listenAddress = host && host !== "0.0.0.0" ? host : undefined;

  const onListen = () => {
    const addr = server.address();
    const lanIp = getLanIp();
    const bound =
      typeof addr === "string"
        ? addr
        : addr
          ? `${addr.address}:${addr.port}`
          : "unknown";
    logger.info(`🚀 PeerConnect API running in ${env.NODE_ENV} mode`);
    logger.info(`   Listening on: ${bound}`);
    logger.info(`   Local:  http://localhost:${env.PORT}`);
    if (lanIp) {
      logger.info(`   Network: http://${lanIp}:${env.PORT}`);
      logger.info(`   API:    http://${lanIp}:${env.PORT}/api/${env.API_VERSION}`);
    } else {
      logger.info(`   Network: http://<your-computer-ip>:${env.PORT}/api/${env.API_VERSION}`);
    }
    logger.info(`   Docs:   http://localhost:${env.PORT}/api-docs`);
    logger.info(`💬 Socket.IO chat server attached to the same port`);
  };

  const server = listenAddress
    ? httpServer.listen(listenAddress, env.PORT, onListen)
    : httpServer.listen(env.PORT, onListen);

  const shutdown = async (signal: string) => {
    logger.warn(`${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info("Shutdown complete.");
      process.exit(0);
    });

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
