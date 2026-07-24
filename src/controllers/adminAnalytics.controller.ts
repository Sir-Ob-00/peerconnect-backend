import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { analyticsService } from "../services/analytics.service";

export const adminAnalyticsController = {
  overview: asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.getOverview();
    sendSuccess(res, { message: "Analytics overview retrieved.", data: data.data });
  }),

  users: asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const data = await analyticsService.getUserGrowth(startDate, endDate);
    sendSuccess(res, { message: "User growth retrieved.", data: data.data });
  }),

  sessions: asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const data = await analyticsService.getSessionTrends(startDate, endDate);
    sendSuccess(res, { message: "Session trends retrieved.", data: data.data });
  }),

  engagement: asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.getEngagementMetrics();
    sendSuccess(res, { message: "Engagement metrics retrieved.", data: data.data });
  }),
};
