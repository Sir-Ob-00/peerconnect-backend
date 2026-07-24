import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { auditLogsService } from "../services/auditLogs.service";

export const adminAuditLogsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const actorId = req.query.actorId as string | undefined;
    const entityType = req.query.entityType as string | undefined;
    const action = req.query.action as string | undefined;
    const data = await auditLogsService.list(actorId, entityType, action, page, limit);
    sendSuccess(res, { message: "Audit logs retrieved.", data });
  }),

  getById: asyncHandler(async (_req: Request, res: Response) => {
    const id = _req.params.id;
    const log = await auditLogsService.getById(id);
    if (!log) throw ApiError.notFound("Audit log not found");
    sendSuccess(res, { message: "Audit log retrieved.", data: log });
  }),

  stats: asyncHandler(async (_req: Request, res: Response) => {
    const data = await auditLogsService.getStats();
    sendSuccess(res, { message: "Audit log stats retrieved.", data });
  }),
};
