import { auditLogRepository } from "../repositories/auditLog.repository";

export const auditLogsService = {
  async list(actorId?: string, entityType?: string, action?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const result = await auditLogRepository.findMany({ actorId, entityType, action, skip, take: limit });
    return {
      data: result.items,
      pagination: { page, limit, totalItems: result.totalItems, totalPages: Math.ceil(result.totalItems / limit) },
    };
  },

  async getById(id: string) {
    return auditLogRepository.findById(id);
  },

  async create(data: { actorId: string; action: string; entityType: string; entityId?: string; changes?: string; ipAddress?: string; userAgent?: string }) {
    return auditLogRepository.create({
      actorId: data.actorId,
      action: data.action as any,
      entityType: data.entityType,
      entityId: data.entityId,
      changes: data.changes,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    } as any);
  },

  async getStats() {
    const totalLogs = await auditLogRepository.findMany({ skip: 0, take: 0 });
    const total = totalLogs.totalItems;
    const byAction: Record<string, number> = {};
    const recent = await auditLogRepository.findMany({ skip: 0, take: 100 });
    for (const log of recent.items) {
      const key = log.action;
      byAction[key] = (byAction[key] || 0) + 1;
    }
    return { total, byAction, recentCount: recent.items.length };
  },
};
