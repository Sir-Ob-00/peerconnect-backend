import type { StudentLearningInterest } from "@prisma/client";
import { prisma } from "../config/database";

export const studentLearningInterestRepository = {
  findByUser(userId: string): Promise<StudentLearningInterest[]> {
    return prisma.studentLearningInterest.findMany({
      where: { userId },
      include: { interest: true },
    });
  },

  add(userId: string, interestId: string): Promise<StudentLearningInterest> {
    return prisma.studentLearningInterest.create({
      data: { userId, interestId },
      include: { interest: true },
    });
  },

  remove(userId: string, interestId: string): Promise<StudentLearningInterest | null> {
    return prisma.studentLearningInterest.findUnique({
      where: { userId_interestId: { userId, interestId } },
    }).then((record) => {
      if (!record) return null;
      return prisma.studentLearningInterest.delete({ where: { id: record.id } });
    });
  },
};
