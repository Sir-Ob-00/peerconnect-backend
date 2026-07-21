import type { Response } from "express";

interface SendSuccessOptions<T> {
  message: string;
  data?: T;
  statusCode?: number;
  meta?: Record<string, unknown>;
}

/**
 * Sends a consistently-shaped success response: { success, message, data?, meta? }.
 * `data` and `meta` are omitted entirely when not provided, so simple
 * responses (like the health check) stay minimal instead of carrying
 * `"data": null` noise.
 */
export function sendSuccess<T>(res: Response, options: SendSuccessOptions<T>): Response {
  const { message, data, statusCode = 200, meta } = options;

  const body: Record<string, unknown> = { success: true, message };
  if (data !== undefined) body.data = data;
  if (meta !== undefined) body.meta = meta;

  return res.status(statusCode).json(body);
}
