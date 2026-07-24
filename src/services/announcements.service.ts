import { prisma } from "../config/database";
import { announcementRepository } from "../repositories/announcement.repository";

export const announcementsService = {
  async list(target?: string, isActive?: boolean, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (target) where.target = target as any;
    if (isActive !== undefined) where.isActive = isActive;

    const [items, totalItems] = await Promise.all([
      (prisma as any).announcement.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      (prisma as any).announcement.count({ where }),
    ]);

    return {
      data: items,
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
    };
  },

  async getById(id: string) {
    return announcementRepository.findById(id);
  },

  async create(data: { title: string; message: string; target?: string; targetId?: string; createdById: string; scheduledAt?: Date; expiresAt?: Date }) {
    return announcementRepository.create({
      title: data.title,
      message: data.message,
      target: (data.target as any) || "ALL",
      targetId: data.targetId,
      createdById: data.createdById,
      scheduledAt: data.scheduledAt,
      expiresAt: data.expiresAt,
    });
  },

  async update(id: string, data: { title?: string; message?: string; target?: string; targetId?: string; isActive?: boolean; scheduledAt?: Date; expiresAt?: Date }) {
    return announcementRepository.update(id, data as any);
  },

  async delete(id: string) {
    return announcementRepository.delete(id);
  },
};
