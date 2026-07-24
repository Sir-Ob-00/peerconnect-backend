import type { Department, Prisma } from "@prisma/client";
import { prisma } from "../config/database";

export const departmentRepository = {
  findById(id: string): Promise<Department | null> {
    return prisma.department.findUnique({ where: { id } });
  },

  findByUniversity(universityId: string, search?: string): Promise<Department[]> {
    const where: Prisma.DepartmentWhereInput = { universityId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }
    return prisma.department.findMany({
      where,
      orderBy: { name: "asc" },
    });
  },

  create(data: Prisma.DepartmentCreateInput): Promise<Department> {
    return prisma.department.create({ data });
  },

  update(id: string, data: Prisma.DepartmentUpdateInput): Promise<Department> {
    return prisma.department.update({ where: { id }, data });
  },
};
