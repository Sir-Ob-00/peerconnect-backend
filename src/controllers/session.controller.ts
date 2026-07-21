import type { Request, Response } from "express";
import { sessionService } from "../services/session.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import type { CreateSessionInput, ListSessionsQuery } from "../validators/session.validator";

function requireUserId(req: Request): string {
  if (!req.user) throw ApiError.unauthorized("Authentication required.");
  return req.user.id;
}

export const sessionController = {
  requestSession: asyncHandler(async (req: Request, res: Response) => {
    const requesterId = requireUserId(req);
    const body = req.body as CreateSessionInput;
    const session = await sessionService.requestSession(requesterId, body);
    sendSuccess(res, { statusCode: 201, message: "Session request sent successfully.", data: session });
  }),

  listIncomingRequests: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { page, limit } = req.query as unknown as ListSessionsQuery;
    const result = await sessionService.listIncomingRequests(userId, page, limit);
    sendSuccess(res, {
      message: "Incoming session requests retrieved successfully.",
      data: { data: result.sessions, pagination: result.pagination },
    });
  }),

  listHistory: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { page, limit } = req.query as unknown as ListSessionsQuery;
    const result = await sessionService.listHistory(userId, page, limit);
    sendSuccess(res, {
      message: "Session history retrieved successfully.",
      data: { data: result.sessions, pagination: result.pagination },
    });
  }),

  accept: asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const userId = requireUserId(req);
    const session = await sessionService.acceptSession(req.params.id, userId);
    sendSuccess(res, { message: "Session request accepted.", data: session });
  }),

  reject: asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const userId = requireUserId(req);
    const session = await sessionService.rejectSession(req.params.id, userId);
    sendSuccess(res, { message: "Session request rejected.", data: session });
  }),

  cancel: asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const userId = requireUserId(req);
    const session = await sessionService.cancelSession(req.params.id, userId);
    sendSuccess(res, { message: "Session cancelled.", data: session });
  }),

  complete: asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const userId = requireUserId(req);
    const session = await sessionService.completeSession(req.params.id, userId);
    sendSuccess(res, { message: "Session marked as completed.", data: session });
  }),
};
