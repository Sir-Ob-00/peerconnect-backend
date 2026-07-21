import type { Request, Response } from "express";
import { notificationService } from "../services/notification.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import type { ListNotificationsQuery } from "../validators/notification.validator";

export const notificationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const { page, limit } = req.query as unknown as ListNotificationsQuery;
    const result = await notificationService.listForUser(req.user.id, page, limit);
    sendSuccess(res, {
      message: "Notifications retrieved successfully.",
      data: { data: result.notifications, pagination: result.pagination, unreadCount: result.unreadCount },
    });
  }),

  markRead: asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const notification = await notificationService.markRead(req.params.id, req.user.id);
    sendSuccess(res, { message: "Notification marked as read.", data: notification });
  }),
};
