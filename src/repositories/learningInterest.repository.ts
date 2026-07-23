import type { LearningInterest } from "@prisma/client";
import { prisma } from "../config/database";

export const learningInterestRepository = {
  findById(id: string): Promise<LearningInterest | null> {
    return prisma.learningInterest.findUnique({ where: { id } });
  },

  findMany(filters?: { isActive?: boolean }): Promise<LearningInterest[]> {
    const where: any = {};
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    return prisma.learningInterest.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    });
  },
};
