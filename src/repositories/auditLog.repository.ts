import { prisma } from "../config/database";

export interface AuditLogWithActor {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  actor: { id: string; firstName: string; lastName: string; email: string; role: string };
}

export const auditLogRepository = {
  async create(data: any): Promise<any> {
    return (prisma as any).auditLog.create({ data });
  },

  async findById(id: string): Promise<any> {
    return (prisma as any).auditLog.findUnique({ where: { id } });
  },

  async findMany(filters: any): Promise<{ items: AuditLogWithActor[]; totalItems: number }> {
    const where: any = {};
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.action) where.action = filters.action;

    const [items, totalItems] = await Promise.all([
      (prisma as any).auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: filters.skip ?? 0,
        take: filters.take ?? 10,
      }),
      (prisma as any).auditLog.count({ where }),
    ]);

    return { items: items as AuditLogWithActor[], totalItems };
  },

  async countByAction(action: string): Promise<number> {
    return (prisma as any).auditLog.count({ where: { action } });
  },
};
