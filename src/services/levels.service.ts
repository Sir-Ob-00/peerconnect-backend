import { prisma } from "../config/database";
import { levelRepository } from "../repositories/level.repository";

export const levelsService = {
  async list(search?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, totalItems] = await Promise.all([
      prisma.level.findMany({ where, orderBy: { sortOrder: "asc" }, skip, take: limit }),
      prisma.level.count({ where }),
    ]);

    return {
      data: items,
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
    };
  },

  async create(data: { name: string; code: string; sortOrder?: number; isActive?: boolean }) {
    return prisma.level.create({
      data: {
        name: data.name,
        code: data.code,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  },

  async update(id: string, data: { name?: string; code?: string; sortOrder?: number; isActive?: boolean }) {
    const existing = await levelRepository.findById(id);
    if (!existing) throw new Error("Level not found");

    return prisma.level.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.code ? { code: data.code } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  },

  async deactivate(id: string) {
    const existing = await levelRepository.findById(id);
    if (!existing) throw new Error("Level not found");
    await prisma.level.update({ where: { id }, data: { isActive: false } });
  },

  async reorder(items: { id: string; sortOrder: number }[]) {
    const ops = items.map((item) =>
      prisma.level.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    );
    await prisma.$transaction(ops);
    return { success: true };
  },
};
