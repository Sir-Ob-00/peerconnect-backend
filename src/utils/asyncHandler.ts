import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRouteHandler<Req extends Request = Request> = (
  req: Req,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Wraps an async controller so a thrown error / rejected promise is passed
 * to `next()` automatically, instead of every controller needing its own
 * try/catch. Usage: router.get("/x", asyncHandler(controller.getX))
 *
 * Generic over the Request type so controllers can type their params/body/
 * query (e.g. `Request<UuidParamInput>`) without a variance mismatch against
 * the default untyped `Request`.
 */
export function asyncHandler<Req extends Request = Request>(handler: AsyncRouteHandler<Req>): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req as Req, res, next)).catch(next);
  };
}
