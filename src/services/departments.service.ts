import { prisma } from "../config/database";
import { departmentRepository } from "../repositories/department.repository";

export const departmentsService = {
  async list(universityId?: string, search?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (universityId) where.universityId = universityId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, totalItems] = await Promise.all([
      prisma.department.findMany({ where, orderBy: { name: "asc" }, skip, take: limit }),
      prisma.department.count({ where }),
    ]);

    return {
      data: items,
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
    };
  },

  async create(data: { name: string; code?: string; universityId: string }) {
    return departmentRepository.create({
      name: data.name,
      code: data.code,
      universityId: data.universityId,
    } as any);
  },

  async update(id: string, data: { name?: string; code?: string; universityId?: string }) {
    const existing = await departmentRepository.findById(id);
    if (!existing) throw new Error("Department not found");

    return prisma.department.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.universityId ? { universityId: data.universityId } : {}),
      },
    });
  },

  async deactivate(id: string) {
    const existing = await departmentRepository.findById(id);
    if (!existing) throw new Error("Department not found");
    await prisma.department.update({ where: { id }, data: { custom: false } });
  },
};
