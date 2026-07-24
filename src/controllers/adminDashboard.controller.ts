import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { adminDashboardService } from "../services/adminDashboard.service";

export const adminDashboardController = {
  getStats: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminDashboardService.getStats();
    sendSuccess(res, { message: "Dashboard stats retrieved.", data: stats });
  }),
};
