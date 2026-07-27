import { auditLogRepository } from "../repositories/auditLog.repository";

export const auditLogsService = {
  async list(action?: string, adminId?: string, startDate?: string, endDate?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const result = await auditLogRepository.findMany({ action, adminId, startDate, endDate, skip, take: limit });
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
    const totalLogs = await auditLogRepository.count();
    const byAction = await auditLogRepository.countByAction();
    return { totalLogs, actionsBreakdown: byAction };
  },
};
