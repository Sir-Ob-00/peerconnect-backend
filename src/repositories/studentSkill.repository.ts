import type { StudentSkill, StudentItemType } from "@prisma/client";
import { prisma } from "../config/database";

export type StudentSkillInput = {
  userId: string;
  skillId: string;
  type: StudentItemType;
};

export const studentSkillRepository = {
  findByUserAndType(userId: string, type: StudentItemType): Promise<StudentSkill[]> {
    return prisma.studentSkill.findMany({
      where: { userId, type },
      include: { skill: true },
    });
  },

  add(input: StudentSkillInput): Promise<StudentSkill> {
    return prisma.studentSkill.create({
      data: {
        userId: input.userId,
        skillId: input.skillId,
        type: input.type,
      },
      include: { skill: true },
    });
  },

  remove(userId: string, skillId: string, type: StudentItemType): Promise<StudentSkill | null> {
    return prisma.studentSkill.findUnique({
      where: { userId_skillId_type: { userId, skillId, type } },
    }).then((record) => {
      if (!record) return null;
      return prisma.studentSkill.delete({ where: { id: record.id } });
    });
  },

  async has(userId: string, skillId: string, type: StudentItemType): Promise<boolean> {
    const count = await prisma.studentSkill.count({
      where: { userId, skillId, type },
    });
    return count > 0;
  },
};
