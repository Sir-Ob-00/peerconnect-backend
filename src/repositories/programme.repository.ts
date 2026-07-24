import type { Programme, Prisma } from "@prisma/client";
import { prisma } from "../config/database";

export const programmeRepository = {
  findById(id: string): Promise<Programme | null> {
    return prisma.programme.findUnique({ where: { id } });
  },

  findByUniversityAndDepartment(universityId: string, departmentId: string, search?: string): Promise<Programme[]> {
    const where: Prisma.ProgrammeWhereInput = {
      universityId,
      departmentId,
    };
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    return prisma.programme.findMany({
      where,
      orderBy: { name: "asc" },
    });
  },

  create(data: Prisma.ProgrammeCreateInput): Promise<Programme> {
    return prisma.programme.create({ data });
  },

  update(id: string, data: Prisma.ProgrammeUpdateInput): Promise<Programme> {
    return prisma.programme.update({ where: { id }, data });
  },
};
