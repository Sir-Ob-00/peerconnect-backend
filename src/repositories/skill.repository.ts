import type { Skill } from "@prisma/client";
import { prisma } from "../config/database";

export const skillRepository = {
  findById(id: string): Promise<Skill | null> {
    return prisma.skill.findUnique({ where: { id } });
  },

  async search(search?: string, programmeId?: string, page = 1, limit = 20): Promise<{ items: Skill[]; totalItems: number }> {
    const where: any = { isActive: true };
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (programmeId) {
      where.programmeId = programmeId;
    }

    const skip = (page - 1) * limit;
    const [items, totalItems] = await Promise.all([
      prisma.skill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }) as Promise<Skill[]>,
      prisma.skill.count({ where }),
    ]);

    return { items, totalItems };
  },

  create(name: string, category?: string, programmeId?: string): Promise<Skill> {
    return prisma.skill.create({
      data: { name: name.trim(), category: category?.trim() || null, programmeId: programmeId || null },
    });
  },
};
