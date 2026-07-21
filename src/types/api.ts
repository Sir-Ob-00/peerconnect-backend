export interface SuccessResponseBody<T = unknown> {
  status: "success";
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export interface ErrorResponseBody {
  status: "error";
  message: string;
  errors?: string[];
  stack?: string;
}
