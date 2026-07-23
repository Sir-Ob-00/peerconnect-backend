import type { Prisma, StudentProfile } from "@prisma/client";
import { prisma } from "../config/database";

export type StudentProfileWritableData = Partial<
  Pick<
    Prisma.StudentProfileUncheckedCreateInput,
    | "university"
    | "department"
    | "level"
    | "skills"
    | "learningInterests"
    | "bio"
    | "availability"
    | "isAvailable"
    | "profilePhoto"
    | "studentId"
    | "programme"
    | "universityId"
    | "departmentId"
    | "levelId"
    | "programmeId"
    | "wantsToLearnCourses"
    | "wantsToLearnSkills"
  >
>;

export const studentProfileRepository = {
  findByUserId(userId: string): Promise<StudentProfile | null> {
    return prisma.studentProfile.findUnique({ where: { userId } });
  },

  /**
   * Fetches a user's profile, creating an empty one on the fly if they
   * don't have one yet. Safe to call from "my profile" endpoints (idempotent
   * on the caller's own row); avoided on the public "view someone else's
   * profile" endpoint, which should never have a side effect on a GET.
   */
  getOrCreateByUserId(userId: string): Promise<StudentProfile> {
    return prisma.studentProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  },

  updateByUserId(userId: string, data: StudentProfileWritableData): Promise<StudentProfile> {
    return prisma.studentProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  },

  setProfilePhoto(userId: string, profilePhoto: string): Promise<StudentProfile> {
    return prisma.studentProfile.upsert({
      where: { userId },
      update: { profilePhoto },
      create: { userId, profilePhoto },
    });
  },
};
