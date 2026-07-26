import type { University, Prisma } from "@prisma/client";
import { prisma } from "../config/database";

export const universityRepository = {
  findById(id: string): Promise<University | null> {
    return prisma.university.findUnique({ where: { id } });
  },

  findByCode(code: string): Promise<University | null> {
    return prisma.university.findFirst({ where: { code: { equals: code, mode: "insensitive" } } });
  },

  findByName(name: string): Promise<University | null> {
    return prisma.university.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  },

  async findByDomainHint(domain: string): Promise<University | null> {
    const parts = domain.toLowerCase().split(".").filter(Boolean);
    const hints = [...new Set(parts)].slice(0, 3);
    for (const hint of hints) {
      if (hint.length < 2) continue;
      const found = await prisma.university.findFirst({
        where: {
          OR: [
            { code: { contains: hint, mode: "insensitive" } },
            { name: { contains: hint, mode: "insensitive" } },
          ],
        },
      });
      if (found) return found;
    }
    return null;
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
