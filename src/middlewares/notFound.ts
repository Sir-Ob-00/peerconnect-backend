import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";

/** Catches any request that didn't match a route and forwards a 404 ApiError. */
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
