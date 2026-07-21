import type { NotificationType } from "@prisma/client";
import { notificationRepository } from "../repositories/notification.repository";
import { toNotificationView, type NotificationView } from "../dtos/notification.dto";
import { toPaginationMeta, type PaginationMeta } from "../dtos/studentDiscovery.dto";
import { emitToUser } from "../sockets/socketEmitter";
import { NOTIFICATION_CONSTANTS } from "../constants/notification.constants";
import { ApiError } from "../utils/ApiError";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}

export const notificationService = {
  /**
   * The one reusable entry point every other service goes through to
   * notify a user — Session (request/accept) and Chat (new message) all
   * call this rather than writing to the Notification table directly.
   * Persists the row, then pushes it over Socket.IO to the user's personal
   * room in real time.
   *
   * Deliberately does NOT send email — only two specific event types need
   * email per spec (session request/accepted), and this function is meant
   * to stay generic across every notification type, including ones that
   * clearly shouldn't email (e.g. CHAT_MESSAGE, or anything added later).
   * Callers that need an email send it themselves, right alongside this
   * call — see `session.service.ts` for the pattern.
   */
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

    // Already read: succeed idempotently rather than erroring — the caller
    // asked for "read" to be true, and it already is.
    if (notification.isRead) {
      return toNotificationView(notification);
    }

    const updated = await notificationRepository.markRead(notificationId);
    return toNotificationView(updated);
  },
};
