import { prisma } from "../config/database";

export interface ReportWithRelations {
  reporter: { id: string; firstName: string; lastName: string; email: string };
  reportedUser: { id: string; firstName: string; lastName: string; email: string };
  admin?: { id: string; firstName: string; lastName: string } | null;
  id: string;
  reporterId: string;
  reportedUserId: string;
  entityType: string;
  entityId: string;
  reason: string;
  description?: string | null;
  status: string;
  adminId?: string | null;
  adminNotes?: string | null;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const reportRepository = {
  async create(data: any): Promise<any> {
    return (prisma as any).report.create({ data });
  },

  async findById(id: string): Promise<any> {
    return (prisma as any).report.findUnique({ where: { id } });
  },

  async findMany(filters: any): Promise<{ items: ReportWithRelations[]; totalItems: number }> {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.reporterId) where.reporterId = filters.reporterId;
    if (filters.reportedUserId) where.reportedUserId = filters.reportedUserId;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.updatedAt?.gte) where.updatedAt = { gte: filters.updatedAt.gte };

    const [items, totalItems] = await Promise.all([
      (prisma as any).report.findMany({
        where,
        include: {
          reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
          reportedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
          admin: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: filters.skip ?? 0,
        take: filters.take ?? 10,
      }),
      (prisma as any).report.count({ where }),
    ]);

    return { items: items as ReportWithRelations[], totalItems };
  },

  async update(id: string, data: any): Promise<any> {
    return (prisma as any).report.update({ where: { id }, data });
  },

  async delete(id: string): Promise<any> {
    return (prisma as any).report.delete({ where: { id } });
  },
};
