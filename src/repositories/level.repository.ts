import type { Level } from "@prisma/client";
import { prisma } from "../config/database";

export const levelRepository = {
  findById(id: string): Promise<Level | null> {
    return prisma.level.findUnique({ where: { id } });
  },

  findMany(filters?: { isActive?: boolean; search?: string }): Promise<Level[]> {
    const where: any = {};
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { code: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    return prisma.level.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    });
  },
};
