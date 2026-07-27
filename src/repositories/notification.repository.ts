import type { Notification, NotificationType, User } from "@prisma/client";
import { prisma } from "../config/database";

interface CreateNotificationData {
  userId: string;
  senderId?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  entityId?: string | null;
  entityType?: string | null;
  targetType?: string | null;
  targetValue?: string | null;
  sentAt?: Date | null;
}

interface ListResult {
  items: (Notification & { sender?: User | null })[];
  totalItems: number;
}

export const notificationRepository = {
  create(data: CreateNotificationData): Promise<Notification & { sender?: User | null }> {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        senderId: data.senderId || null,
        title: data.title,
        message: data.message,
        type: data.type,
        entityId: data.entityId || null,
        entityType: data.entityType || null,
        targetType: data.targetType || null,
        targetValue: data.targetValue || null,
        sentAt: data.sentAt || null,
      },
      include: { sender: true },
    });
  },

  findById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({ where: { id } });
  },

  async listByUser({ userId, skip, take }: { userId: string; skip: number; take: number }): Promise<ListResult> {
    const where = { userId };
    const [items, totalItems] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { sender: true },
      }),
      prisma.notification.count({ where }),
    ]);
    return { items, totalItems };
  },

  async listAll({ skip, take, type }: { skip: number; take: number; type?: string }): Promise<ListResult> {
    const where: any = {};
    if (type) where.type = type;

    const [items, totalItems] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { sender: true },
      }),
      prisma.notification.count({ where }),
    ]);
    return { items, totalItems };
  },

  countUnread(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  markRead(id: string): Promise<Notification> {
    return prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
  },

  markAllRead(userId: string): Promise<number> {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    }).then((res) => res.count);
  },

  delete(id: string): Promise<Notification> {
    return prisma.notification.delete({ where: { id } });
  },
};
