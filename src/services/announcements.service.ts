import { prisma } from "../config/database";
import { announcementRepository } from "../repositories/announcement.repository";

export const announcementsService = {
  async list(search?: string, status?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
      ];
    }

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

  async create(data: { title: string; message: string; target?: string; targetId?: string; createdById: string; scheduledAt?: Date; expiresAt?: Date; status?: string }) {
    return announcementRepository.create({
      title: data.title,
      message: data.message,
      target: (data.target as any) || "ALL",
      targetId: data.targetId,
      createdById: data.createdById,
      scheduledAt: data.scheduledAt,
      expiresAt: data.expiresAt,
      status: (data.status as any) || "PUBLISHED",
    });
  },

  async update(id: string, data: { title?: string; message?: string; target?: string; targetId?: string; isActive?: boolean; scheduledAt?: Date; expiresAt?: Date; status?: string }) {
    return announcementRepository.update(id, data as any);
  },

  async delete(id: string) {
    return announcementRepository.delete(id);
  },
};
