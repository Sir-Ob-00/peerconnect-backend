import { PrismaClient } from "@prisma/client";
import { env } from "./env";
import { logger } from "./logger";

/**
 * A single PrismaClient instance shared across the app. In dev, Node's
 * module cache combined with tsx's watch-mode restarts can otherwise spawn
 * multiple clients (and exhaust DB connections), so we stash the instance
 * on `global` the same way Prisma's own docs recommend.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: env.isDevelopment ? ["warn", "error"] : ["error"],
  });

if (!env.isProduction) {
  global.__prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info("Database connected");
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info("Database disconnected");
}
