import { prisma } from "../config/database";
import { universityRepository } from "../repositories/university.repository";

export const universitiesService = {
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
      prisma.university.findMany({ where, orderBy: { name: "asc" }, skip, take: limit }),
      prisma.university.count({ where }),
    ]);

    return {
      data: items,
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
    };
  },

  async create(data: { name: string; code: string; isActive?: boolean }) {
    return universityRepository.create({
      name: data.name,
      code: data.code.toUpperCase(),
      isActive: data.isActive ?? true,
    });
  },

  async update(id: string, data: { name?: string; code?: string; isActive?: boolean }) {
    const existing = await universityRepository.findById(id);
    if (!existing) throw new Error("University not found");

    return prisma.university.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.code ? { code: data.code.toUpperCase() } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  },

  async deactivate(id: string) {
    const existing = await universityRepository.findById(id);
    if (!existing) throw new Error("University not found");
    await prisma.university.update({ where: { id }, data: { isActive: false } });
  },
};
