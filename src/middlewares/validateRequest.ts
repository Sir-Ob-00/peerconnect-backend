import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ApiError } from "../utils/ApiError";

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Reusable validation middleware factory. Pass Zod schemas for whichever
 * parts of the request you need validated:
 *
 *   router.post("/users", validateRequest({ body: createUserSchema }), controller.create)
 *
 * On success, `req.body`/`query`/`params` are replaced with the *parsed*
 * (and therefore type-coerced/defaulted) values. On failure, a single 422
 * ApiError is thrown with a human-readable message per invalid field.
 */
export function validateRequest(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const fieldErrors: string[] = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        fieldErrors.push(...result.error.issues.map((i) => `body.${i.path.join(".") || "value"}: ${i.message}`));
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        fieldErrors.push(...result.error.issues.map((i) => `query.${i.path.join(".") || "value"}: ${i.message}`));
      } else {
        req.query = result.data;
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        fieldErrors.push(...result.error.issues.map((i) => `params.${i.path.join(".") || "value"}: ${i.message}`));
      } else {
        req.params = result.data;
      }
    }

    if (fieldErrors.length > 0) {
      return next(ApiError.unprocessable("Validation failed", fieldErrors));
    }

    next();
  };
}
