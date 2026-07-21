/**
 * Represents a known, "expected" error (bad input, not found, unauthorized...)
 * as opposed to a bug. The global error handler treats ApiError instances
 * differently from unexpected exceptions: it trusts the statusCode/message
 * and sends them straight to the client instead of masking them as a 500.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: string[];

  constructor(statusCode: number, message: string, errors?: string[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request", errors?: string[]) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }

  static conflict(message = "Resource already exists") {
    return new ApiError(409, message);
  }

  static unprocessable(message = "Validation failed", errors?: string[]) {
    return new ApiError(422, message, errors);
  }

  static tooManyRequests(message = "Too many requests, please try again later") {
    return new ApiError(429, message);
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, message);
  }

  static notImplemented(message = "Not implemented yet") {
    return new ApiError(501, message);
  }
}
