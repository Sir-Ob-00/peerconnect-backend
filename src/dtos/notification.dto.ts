import type { Notification, User } from "@prisma/client";

export interface SenderInfo {
  id: string;
  fullName: string;
  profileImage: string | null;
}

export interface NotificationView {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt: string | null;
  entityId: string | null;
  entityType: string | null;
  targetType: string | null;
  targetValue: string | null;
  sentAt: string | null;
  sender: SenderInfo | null;
  createdAt: string;
}

export function toNotificationView(notification: Notification & { sender?: User | null }): NotificationView {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    isRead: notification.isRead,
    readAt: notification.readAt ? notification.readAt.toISOString() : null,
    entityId: notification.entityId,
    entityType: notification.entityType,
    targetType: notification.targetType ?? null,
    targetValue: notification.targetValue ?? null,
    sentAt: notification.sentAt ? notification.sentAt.toISOString() : null,
    sender: notification.sender
      ? {
          id: notification.sender.id,
          fullName: `${notification.sender.firstName} ${notification.sender.lastName}`.trim(),
          profileImage: notification.sender.profileImage || null,
        }
      : null,
    createdAt: notification.createdAt.toISOString(),
  };
}
