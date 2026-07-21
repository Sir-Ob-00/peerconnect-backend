import type { Notification, NotificationType } from "@prisma/client";
import { prisma } from "../config/database";

interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}

interface ListParams {
  userId: string;
  skip: number;
  take: number;
}

interface ListResult {
  items: Notification[];
  totalItems: number;
}

export const notificationRepository = {
  create(data: CreateNotificationData): Promise<Notification> {
    return prisma.notification.create({ data });
  },

  findById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({ where: { id } });
  },

  async listByUser({ userId, skip, take }: ListParams): Promise<ListResult> {
    const where = { userId };
    const [items, totalItems] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.notification.count({ where }),
    ]);
    return { items, totalItems };
  },

  countUnread(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  markRead(id: string): Promise<Notification> {
    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  },
};
