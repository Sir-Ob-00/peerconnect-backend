import { ApiError } from "../utils/ApiError";
import { notificationRepository } from "../repositories/notification.repository";
import { userRepository } from "../repositories/user.repository";

export const notificationsService = {
  async listAllNotifications(filters: { userId?: string }, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    let result: { items: any[]; totalItems: number };
    if (filters.userId) {
      result = await notificationRepository.listByUser({ userId: filters.userId, skip, take: limit });
    } else {
      result = { items: [], totalItems: 0 };
    }

    return {
      data: result.items,
      pagination: { page, limit, totalItems: result.totalItems, totalPages: Math.ceil(result.totalItems / limit) },
    };
  },

  async createUserNotification(userId: string, title: string, message: string, type: string = "SESSION_REQUEST") {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound("User not found.");

    return notificationRepository.create({ userId, title, message, type: type as any });
  },

  async broadcastNotification(title: string, message: string) {
    const users = await userRepository.findMany({ take: 1000 });
    const results = [];
    for (const user of users.items) {
      const n = await notificationRepository.create({
        userId: user.id,
        title,
        message,
        type: "SESSION_REQUEST",
      });
      results.push(n);
    }
    return results;
  },

  async deleteNotification(id: string) {
    const notification = await notificationRepository.findById(id);
    if (!notification) throw ApiError.notFound("Notification not found.");
    return notificationRepository.delete(id);
  },
};
