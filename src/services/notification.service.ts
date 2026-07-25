import type { NotificationType } from "@prisma/client";
import { notificationRepository } from "../repositories/notification.repository";
import { toNotificationView, type NotificationView } from "../dtos/notification.dto";
import { toPaginationMeta, type PaginationMeta } from "../dtos/studentDiscovery.dto";
import { emitToUser } from "../sockets/socketEmitter";
import { NOTIFICATION_CONSTANTS } from "../constants/notification.constants";
import { ApiError } from "../utils/ApiError";

export interface CreateNotificationInput {
  userId: string;
  senderId?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  entityId?: string | null;
  entityType?: string | null;
}

export const notificationService = {
  async createNotification(input: CreateNotificationInput): Promise<NotificationView> {
    const notification = await notificationRepository.create(input);
    const view = toNotificationView(notification);

    emitToUser(input.userId, NOTIFICATION_CONSTANTS.SOCKET_EVENT, view);

    return view;
  },

  async listForUser(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ notifications: NotificationView[]; pagination: PaginationMeta; unreadCount: number }> {
    const [{ items, totalItems }, unreadCount] = await Promise.all([
      notificationRepository.listByUser({ userId, skip: (page - 1) * limit, take: limit }),
      notificationRepository.countUnread(userId),
    ]);

    return {
      notifications: items.map(toNotificationView),
      pagination: toPaginationMeta(page, limit, totalItems),
      unreadCount,
    };
  },

  async markRead(notificationId: string, userId: string): Promise<NotificationView> {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) {
      throw ApiError.notFound("Notification not found.");
    }
    if (notification.userId !== userId) {
      throw ApiError.forbidden("This notification does not belong to you.");
    }

    if (notification.isRead) {
      return toNotificationView(notification);
    }

    const updated = await notificationRepository.markRead(notificationId);
    return toNotificationView(updated);
  },

  async markAllRead(userId: string): Promise<{ markedRead: number }> {
    const markedRead = await notificationRepository.markAllRead(userId);
    return { markedRead };
  },

  async unreadCount(userId: string): Promise<number> {
    return notificationRepository.countUnread(userId);
  },

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) {
      throw ApiError.notFound("Notification not found.");
    }
    if (notification.userId !== userId) {
      throw ApiError.forbidden("This notification does not belong to you.");
    }
    await notificationRepository.delete(notificationId);
  },
};
