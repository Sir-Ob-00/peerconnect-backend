import { prisma } from "../config/database";

export interface AuditLogWithActor {
  id: string;
  action: string;
  adminId: string;
  adminName: string;
  targetEntity: string;
  targetId?: string;
  description?: string;
  ipAddress?: string;
  createdAt: Date;
}

export const auditLogRepository = {
  async create(data: any): Promise<any> {
    return (prisma as any).auditLog.create({ data });
  },

  async findById(id: string): Promise<any> {
    return (prisma as any).auditLog.findUnique({ where: { id }, include: { actor: { select: { id: true, firstName: true, lastName: true } } } });
  },

  async findMany(filters: any): Promise<{ items: AuditLogWithActor[]; totalItems: number }> {
    const where: any = {};
    if (filters.adminId) where.actorId = filters.adminId;
    if (filters.action) where.action = filters.action;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [items, totalItems] = await Promise.all([
      (prisma as any).auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: filters.skip ?? 0,
        take: filters.take ?? 10,
      }),
      (prisma as any).auditLog.count({ where }),
    ]);

    return {
      items: items.map((log: any) => ({
        id: log.id,
        action: log.action,
        adminId: log.actorId,
        adminName: log.actor ? `${log.actor.firstName} ${log.actor.lastName}`.trim() : "System",
        targetEntity: log.entityType,
        targetId: log.entityId,
        description: log.changes,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
      })),
      totalItems,
    };
  },

  async count(): Promise<number> {
    return (prisma as any).auditLog.count();
  },

  async countByAction(): Promise<Record<string, number>> {
    const logs = await (prisma as any).auditLog.findMany({
      select: { action: true },
    });
    const counts: Record<string, number> = {};
    for (const log of logs) {
      counts[log.action] = (counts[log.action] || 0) + 1;
    }
    return counts;
  },
};
