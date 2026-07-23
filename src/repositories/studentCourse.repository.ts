import type { StudentCourse, StudentItemType } from "@prisma/client";
import { prisma } from "../config/database";

export type StudentCourseInput = {
  userId: string;
  courseId: string;
  type: StudentItemType;
};

export const studentCourseRepository = {
  findByUserAndType(userId: string, type: StudentItemType): Promise<StudentCourse[]> {
    return prisma.studentCourse.findMany({
      where: { userId, type },
      include: { course: true },
    });
  },

  add(input: StudentCourseInput): Promise<StudentCourse> {
    return prisma.studentCourse.create({
      data: {
        userId: input.userId,
        courseId: input.courseId,
        type: input.type,
      },
      include: { course: true },
    });
  },

  remove(userId: string, courseId: string, type: StudentItemType): Promise<StudentCourse | null> {
    return prisma.studentCourse.findUnique({
      where: { userId_courseId_type: { userId, courseId, type } },
    }).then((record) => {
      if (!record) return null;
      return prisma.studentCourse.delete({ where: { id: record.id } });
    });
  },

  async has(userId: string, courseId: string, type: StudentItemType): Promise<boolean> {
    const count = await prisma.studentCourse.count({
      where: { userId, courseId, type },
    });
    return count > 0;
  },
};
