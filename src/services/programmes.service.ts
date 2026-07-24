import { prisma } from "../config/database";
import { programmeRepository } from "../repositories/programme.repository";

export const programmesService = {
  async list(universityId?: string, departmentId?: string, search?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (universityId) where.universityId = universityId;
    if (departmentId) where.departmentId = departmentId;
    if (search) where.name = { contains: search, mode: "insensitive" };

    const [items, totalItems] = await Promise.all([
      prisma.programme.findMany({ where, orderBy: { name: "asc" }, skip, take: limit }),
      prisma.programme.count({ where }),
    ]);

    return {
      data: items,
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
    };
  },

  async create(data: { name: string; universityId: string; departmentId: string }) {
    return programmeRepository.create({
      name: data.name,
      universityId: data.universityId,
      departmentId: data.departmentId,
    } as any);
  },

  async update(id: string, data: { name?: string; universityId?: string; departmentId?: string }) {
    const existing = await programmeRepository.findById(id);
    if (!existing) throw new Error("Programme not found");

    return prisma.programme.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.universityId ? { universityId: data.universityId } : {}),
        ...(data.departmentId ? { departmentId: data.departmentId } : {}),
      },
    });
  },

  async deactivate(id: string) {
    const existing = await programmeRepository.findById(id);
    if (!existing) throw new Error("Programme not found");
    await prisma.programme.update({ where: { id }, data: { custom: false } });
  },
};
