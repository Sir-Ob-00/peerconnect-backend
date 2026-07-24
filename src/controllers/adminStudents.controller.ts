import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { userRepository } from "../repositories/user.repository";
import { studentProfileRepository } from "../repositories/studentProfile.repository";
import { ApiError } from "../utils/ApiError";
import { prisma } from "../config/database";
import type { AdminStudentsQuery } from "../validators/admin.validator";

export const adminStudentsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as AdminStudentsQuery;
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const { items, totalItems } = await userRepository.findMany({
      search: query.search,
      role: query.role,
      verificationStatus: query.verificationStatus,
      accountStatus: query.accountStatus,
      skip,
      take: limit,
    });

    if (items.length === 0) {
      return sendSuccess(res, { message: "Students retrieved.", data: { data: [], pagination: { page, limit, totalItems: 0, totalPages: 0 } } });
    }

    const userIds = items.map((u) => u.id);
    const profiles = await prisma.studentProfile.findMany({ where: { userId: { in: userIds } }, include: { user: true } });

    const universityIds = profiles.map((p) => p.universityId).filter(Boolean) as string[];
    const departmentIds = profiles.map((p) => p.departmentId).filter(Boolean) as string[];
    const programmeIds = profiles.map((p) => p.programmeId).filter(Boolean) as string[];
    const levelIds = profiles.map((p) => p.levelId).filter(Boolean) as string[];

    const [universities, departments, programmes, levels] = await Promise.all([
      prisma.university.findMany({ where: { id: { in: universityIds } } }),
      prisma.department.findMany({ where: { id: { in: departmentIds } } }),
      prisma.programme.findMany({ where: { id: { in: programmeIds } } }),
      prisma.level.findMany({ where: { id: { in: levelIds } } }),
    ]);

    const profileMap = new Map(profiles.map((p) => [p.userId, p]));
    const universityMap = new Map(universities.map((u: any) => [u.id, u.name]));
    const departmentMap = new Map(departments.map((d: any) => [d.id, d.name]));
    const programmeMap = new Map(programmes.map((p: any) => [p.id, p.name]));
    const levelMap = new Map(levels.map((l: any) => [l.id, l.name]));

    const rows = items.map((u) => {
      const profile = profileMap.get(u.id);
      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role,
        accountStatus: u.accountStatus,
        profileImage: u.profileImage || profile?.profilePhoto || null,
        isEmailVerified: u.isEmailVerified,
        studentVerified: u.studentVerified,
        verificationStatus: u.verificationStatus,
        setupProgress: u.setupProgress,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        academicProfile: {
          university: profile?.universityId ? universityMap.get(profile.universityId) ?? null : null,
          department: profile?.departmentId ? departmentMap.get(profile.departmentId) ?? null : null,
          programme: profile?.programmeId ? programmeMap.get(profile.programmeId) ?? null : null,
          level: profile?.levelId ? levelMap.get(profile.levelId) ?? null : null,
        },
        profile: profile
          ? {
              profilePhoto: profile.profilePhoto,
              university: profile.university,
              department: profile.department,
              level: profile.level,
              programme: profile.programme,
              skills: profile.skills,
              learningInterests: profile.learningInterests,
              isAvailable: profile.isAvailable,
              studentId: profile.studentId,
              wantsToLearnCourses: profile.wantsToLearnCourses,
              wantsToLearnSkills: profile.wantsToLearnSkills,
            }
          : null,
      };
    });

    return sendSuccess(res, {
      message: "Students retrieved.",
      data: {
        data: rows,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
        },
      },
    });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound("Student not found");

    const profile = await studentProfileRepository.findByUserId(user.id);

    let universityName: string | null = null;
    let departmentName: string | null = null;
    let programmeName: string | null = null;
    let levelName: string | null = null;

    if (profile?.universityId) {
      const university = await prisma.university.findUnique({ where: { id: profile.universityId } });
      universityName = university?.name ?? null;
    }
    if (profile?.departmentId) {
      const department = await prisma.department.findUnique({ where: { id: profile.departmentId } });
      departmentName = department?.name ?? null;
    }
    if (profile?.programmeId) {
      const programme = await prisma.programme.findUnique({ where: { id: profile.programmeId } });
      programmeName = programme?.name ?? null;
    }
    if (profile?.levelId) {
      const level = await prisma.level.findUnique({ where: { id: profile.levelId } });
      levelName = level?.name ?? null;
    }

    const [
      learningCourses,
      learningSkills,
      helpCourses,
      helpSkills,
      interests,
      availabilitySlots,
    ] = await Promise.all([
      prisma.studentCourse.findMany({
        where: { userId: user.id, type: "LEARNING" },
        include: { course: true },
      }),
      prisma.studentSkill.findMany({
        where: { userId: user.id, type: "LEARNING" },
        include: { skill: true },
      }),
      prisma.studentCourse.findMany({
        where: { userId: user.id, type: "HELP" },
        include: { course: true },
      }),
      prisma.studentSkill.findMany({
        where: { userId: user.id, type: "HELP" },
        include: { skill: true },
      }),
      prisma.studentLearningInterest.findMany({
        where: { userId: user.id },
        include: { interest: true },
      }),
      prisma.availability.findMany({
        where: { userId: user.id },
        orderBy: { dayOfWeek: "asc" },
      }),
    ]);

    sendSuccess(res, {
      message: "Student retrieved.",
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        profileImage: user.profileImage || profile?.profilePhoto || null,
        isEmailVerified: user.isEmailVerified,
        studentVerified: user.studentVerified,
        verificationStatus: user.verificationStatus,
        setupProgress: user.setupProgress,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        academicProfile: {
          university: universityName,
          department: departmentName,
          programme: programmeName,
          level: levelName,
        },
        learningGoals: {
          courses: learningCourses.map((lc) => ({
            id: lc.course.id,
            name: lc.course.name,
            code: lc.course.code,
          })),
          skills: learningSkills.map((ls) => ({
            id: ls.skill.id,
            name: ls.skill.name,
          })),
        },
        canHelpWith: {
          courses: helpCourses.map((hc) => ({
            id: hc.course.id,
            name: hc.course.name,
            code: hc.course.code,
          })),
          skills: helpSkills.map((hs) => ({
            id: hs.skill.id,
            name: hs.skill.name,
          })),
        },
        learningInterests: interests.map((li) => ({
          id: li.interest.id,
          name: li.interest.name,
          description: li.interest.description,
        })),
        availability: availabilitySlots.map((a) => ({
          id: a.id,
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
        })),
        bio: profile?.bio ?? null,
        profilePhoto: profile?.profilePhoto ?? null,
        idVerification: {
          idPhotoUrl: user.idPhotoUrl,
          status: user.verificationStatus,
          submittedAt: user.updatedAt,
          rejectionReason: user.adminNotes,
        },
      },
    });
  }),
};
