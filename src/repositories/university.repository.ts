import type { University, Prisma } from "@prisma/client";
import { prisma } from "../config/database";

export const universityRepository = {
  findById(id: string): Promise<University | null> {
    return prisma.university.findUnique({ where: { id } });
  },

  findByCode(code: string): Promise<University | null> {
    return prisma.university.findUnique({ where: { code: code.toLowerCase() } });
  },

  findMany(filters?: { search?: string; isActive?: boolean }): Promise<University[]> {
    const where: Prisma.UniversityWhereInput = {};
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { code: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    return prisma.university.findMany({
      where,
      orderBy: { name: "asc" },
    });
  },

  create(data: Prisma.UniversityCreateInput): Promise<University> {
    return prisma.university.create({ data });
  },

  update(id: string, data: Prisma.UniversityUpdateInput): Promise<University> {
    return prisma.university.update({ where: { id }, data });
  },
};
