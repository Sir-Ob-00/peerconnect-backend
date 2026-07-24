import { reportRepository } from "../repositories/report.repository";

export const reportsService = {
  async list(status?: string, entityType?: string, reporterId?: string, reportedUserId?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const result = await reportRepository.findMany({
      status,
      entityType,
      reporterId,
      reportedUserId,
      skip,
      take: limit,
    });
    return {
      data: result.items,
      pagination: { page, limit, totalItems: result.totalItems, totalPages: Math.ceil(result.totalItems / limit) },
    };
  },

  async getById(id: string) {
    return reportRepository.findById(id);
  },

  async create(data: { reporterId: string; reportedUserId: string; entityType: string; entityId: string; reason: string; description?: string }) {
    return reportRepository.create({
      reporterId: data.reporterId,
      reportedUserId: data.reportedUserId,
      entityType: data.entityType as any,
      entityId: data.entityId,
      reason: data.reason,
      description: data.description,
    });
  },

  async updateStatus(id: string, status: string, adminNotes?: string, adminId?: string) {
    const report = await reportRepository.findById(id);
    if (!report) throw new Error("Report not found");

    return reportRepository.update(id, {
      status: status as any,
      adminNotes,
      adminId,
      resolvedAt: status === "RESOLVED" ? new Date() : undefined,
    } as any);
  },

  async delete(id: string) {
    const report = await reportRepository.findById(id);
    if (!report) throw new Error("Report not found");
    await reportRepository.delete(id);
  },
};
