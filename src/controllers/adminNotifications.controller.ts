import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { notificationService } from "../services/notification.service";
import { notificationRepository } from "../repositories/notification.repository";
import { userRepository } from "../repositories/user.repository";

export const adminNotificationsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const userId = req.query.userId as string | undefined;

    let items: any[] = [];
    let totalItems = 0;

    if (userId) {
      const result = await notificationRepository.listByUser({ userId, skip: (page - 1) * limit, take: limit });
      items = result.items;
      totalItems = result.totalItems;
    }

    sendSuccess(res, {
      message: "Notifications retrieved.",
      data: {
        data: items,
        pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
      },
    });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { userId, title, message, type } = req.body;
    if (!userId) throw ApiError.badRequest("userId is required");
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    const notification = await notificationService.createNotification({
      userId,
      title,
      message,
      type: type || "SESSION_REQUEST",
    });
    sendSuccess(res, { statusCode: 201, message: "Notification sent.", data: notification });
  }),

  broadcast: asyncHandler(async (req: Request, res: Response) => {
    const { title, message } = req.body;
    const users = await userRepository.findMany({});
    const notifications = await Promise.all(
      users.items.map((u: any) =>
        notificationService.createNotification({
          userId: u.id,
          title,
          message,
          type: "SESSION_REQUEST",
        })
      )
    );
    sendSuccess(res, { statusCode: 201, message: `Broadcast sent to ${notifications.length} users.`, data: { count: notifications.length } });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await notificationRepository.delete(id);
    sendSuccess(res, { message: "Notification deleted." });
  }),
};
