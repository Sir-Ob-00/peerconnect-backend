import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { reportsService } from "../services/reports.service";

export const adminReportsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const status = req.query.status as string | undefined;
    const entityType = req.query.entityType as string | undefined;
    const reporterId = req.query.reporterId as string | undefined;
    const reportedUserId = req.query.reportedUserId as string | undefined;
    const data = await reportsService.list(status, entityType, reporterId, reportedUserId, page, limit);
    sendSuccess(res, { message: "Reports retrieved.", data });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const report = await reportsService.getById(id);
    if (!report) throw ApiError.notFound("Report not found");
    sendSuccess(res, { message: "Report retrieved.", data: report });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const report = await reportsService.create(req.body);
    sendSuccess(res, { statusCode: 201, message: "Report created.", data: report });
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = (req as any).user?.id;
    const report = await reportsService.updateStatus(id, req.body.status, req.body.adminNotes, adminId);
    sendSuccess(res, { message: "Report status updated.", data: report });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await reportsService.delete(id);
    sendSuccess(res, { message: "Report deleted." });
  }),
};
