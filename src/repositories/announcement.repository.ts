import { prisma } from "../config/database";

export interface AnnouncementWithCreator {
  id: string;
  title: string;
  message: string;
  content?: string;
  target: string;
  targetId?: string;
  status?: string;
  isActive?: boolean;
  scheduledAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; firstName: string; lastName: string; email: string };
}

export const announcementRepository = {
  async create(data: any): Promise<any> {
    return (prisma as any).announcement.create({ data });
  },

  async findById(id: string): Promise<any> {
    return (prisma as any).announcement.findUnique({ where: { id } });
  },

  async findMany(filters: any): Promise<{ items: AnnouncementWithCreator[]; totalItems: number }> {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.target) where.target = filters.target;
    if (filters.createdById) where.createdById = filters.createdById;

    const [items, totalItems] = await Promise.all([
      (prisma as any).announcement.findMany({
        where,
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: filters.skip ?? 0,
        take: filters.take ?? 10,
      }),
      (prisma as any).announcement.count({ where }),
    ]);

    return { items: items as AnnouncementWithCreator[], totalItems };
  },

  async update(id: string, data: any): Promise<any> {
    return (prisma as any).announcement.update({ where: { id }, data });
  },

  async delete(id: string): Promise<any> {
    return (prisma as any).announcement.delete({ where: { id } });
  },
};
