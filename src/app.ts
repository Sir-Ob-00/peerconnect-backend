import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";
import { requestLogger } from "./middlewares/requestLogger";
import { apiRateLimiter } from "./middlewares/rateLimiter";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";
import { v1Router } from "./routes/v1";

export function createApp(): Application {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  // Response compression
  app.use(compression());

  // HTTP access logging
  app.use(requestLogger);

  // Rate limiting — applied to all API routes
  app.use(`/api/${env.API_VERSION}`, apiRateLimiter);

  // API documentation
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api-docs.json", (_req, res) => res.json(swaggerSpec));

  // Versioned API routes
  app.use(`/api/${env.API_VERSION}`, v1Router);

  // Root
  app.get("/", (_req, res) => {
    res.json({
      success: true,
      message: "Welcome to the PeerConnect API",
      docs: "/api-docs",
      health: `/api/${env.API_VERSION}/health`,
    });
  });

  // 404 + centralized error handling — must be registered last, in order
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
