import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";
import { logger } from "../config/logger";

/**
 * Normalizes any thrown error — ApiError, Zod validation error, known Prisma
 * error, Multer upload error, or an unexpected bug — into the same
 * { success, message, errors? } response shape. Must be registered last,
 * after all routes.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = "Internal server error";
  let errors: string[] | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    message = "Validation failed";
    errors = err.issues.map((issue) => `${issue.path.join(".") || "value"}: ${issue.message}`);
  } else if (err instanceof MulterError) {
    ({ statusCode, message } = mapMulterError(err));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    ({ statusCode, message } = mapPrismaError(err));
  } else if (err instanceof Error) {
    message = env.isProduction ? message : err.message;
  }

  const isServerError = statusCode >= 500;
  logger[isServerError ? "error" : "warn"](
    `${req.method} ${req.originalUrl} -> ${statusCode} ${message}`,
    isServerError && err instanceof Error ? { stack: err.stack } : undefined
  );

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(!env.isProduction && err instanceof Error && isServerError ? { stack: err.stack } : {}),
  });
}

function mapMulterError(err: MulterError): { statusCode: number; message: string } {
  switch (err.code) {
    case "LIMIT_FILE_SIZE":
      return { statusCode: 400, message: "File is too large. Check the upload size limit for this endpoint." };
    case "LIMIT_UNEXPECTED_FILE":
      return { statusCode: 400, message: "Unexpected file field. Check the expected form field name for this endpoint." };
    default:
      return { statusCode: 400, message: "File upload failed." };
  }
}

function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): { statusCode: number; message: string } {
  switch (err.code) {
    case "P2002": {
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return { statusCode: 409, message: `A record with this ${target} already exists.` };
    }
    case "P2025":
      return { statusCode: 404, message: "Requested record was not found." };
    default:
      return { statusCode: 500, message: "Database error." };
  }
}
