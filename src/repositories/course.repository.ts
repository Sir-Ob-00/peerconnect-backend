import type { Course, Prisma } from "@prisma/client";
import { prisma } from "../config/database";

export const courseRepository = {
  findById(id: string): Promise<Course | null> {
    return prisma.course.findUnique({ where: { id } });
  },

  async search(filters: {
    universityId?: string;
    departmentId?: string;
    levelId?: string;
    programmeId?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ items: Course[]; totalItems: number }> {
    const where: Prisma.CourseWhereInput = { isActive: true };
    if (filters.universityId) where.universityId = filters.universityId;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.levelId) where.levelId = filters.levelId;
    if (filters.programmeId) where.programmeId = filters.programmeId;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { code: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const skip = (filters.page - 1) * filters.limit;
    const [items, totalItems] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { name: "asc" },
      }) as Promise<Course[]>,
      prisma.course.count({ where }),
    ]);

    return { items, totalItems };
  },

  create(data: Prisma.CourseCreateInput): Promise<Course> {
    return prisma.course.create({ data });
  },
};
