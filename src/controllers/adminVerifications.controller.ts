import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { userRepository } from "../repositories/user.repository";
import { studentProfileRepository } from "../repositories/studentProfile.repository";
import { emitToUser } from "../sockets/socketEmitter";
import { prisma } from "../config/database";
import { notificationService } from "../services/notification.service";

export const adminVerificationsController = {
  listPending: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const skip = (page - 1) * limit;
    const status = (req.query.status as string) || "pending_approval";

    const [users, totalItems] = await Promise.all([
      userRepository.findByVerificationStatus(status),
      userRepository.countByVerificationStatus(status),
    ]);

    if (users.length === 0) {
      return sendSuccess(res, { message: "Verifications retrieved.", data: { data: [], pagination: { page, limit, totalItems: 0, totalPages: 0 } } });
    }

    const userIds = users.map((u) => u.id);
    const [profiles, universities, departments, programmes, levels] = await Promise.all([
      prisma.studentProfile.findMany({ where: { userId: { in: userIds } }, include: { user: true } }),
      prisma.university.findMany({ where: { id: { in: users.map((u: any) => (u as any).studentProfile?.universityId).filter(Boolean) } } }),
      prisma.department.findMany({ where: { id: { in: users.map((u: any) => (u as any).studentProfile?.departmentId).filter(Boolean) } } }),
      prisma.programme.findMany({ where: { id: { in: users.map((u: any) => (u as any).studentProfile?.programmeId).filter(Boolean) } } }),
      prisma.level.findMany({ where: { id: { in: users.map((u: any) => (u as any).studentProfile?.levelId).filter(Boolean) } } }),
    ]);

    const profileMap = new Map(profiles.map((p) => [p.userId, p]));
    const universityMap = new Map(universities.map((u) => [u.id, u.name]));
    const departmentMap = new Map(departments.map((d) => [d.id, d.name]));
    const programmeMap = new Map(programmes.map((p) => [p.id, p.name]));
    const levelMap = new Map(levels.map((l) => [l.id, l.name]));

    const rows = users.map((u: any) => {
      const profile = profileMap.get(u.id);
      return {
        userId: u.id,
        fullName: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        accountStatus: u.accountStatus,
        setupProgress: u.setupProgress,
        verificationStatus: u.verificationStatus,
        isEmailVerified: u.isEmailVerified,
        studentVerified: u.studentVerified,
        profileImage: u.profileImage || profile?.profilePhoto || null,
        avatarUrl: u.profileImage || profile?.profilePhoto || null,
        idPhotoUrl: u.idPhotoUrl ?? null,
        adminNotes: u.adminNotes ?? null,
        submittedAt: u.updatedAt,
        academicProfile: {
          university: profile?.universityId ? universityMap.get(profile.universityId) ?? null : null,
          department: profile?.departmentId ? departmentMap.get(profile.departmentId) ?? null : null,
          programme: profile?.programmeId ? programmeMap.get(profile.programmeId) ?? null : null,
          level: profile?.levelId ? levelMap.get(profile.levelId) ?? null : null,
        },
        profile: profile
          ? {
              university: profile.university,
              department: profile.department,
              level: profile.level,
              programme: profile.programme,
              skills: profile.skills,
              learningInterests: profile.learningInterests,
              bio: profile.bio,
              availability: profile.availability,
              isAvailable: profile.isAvailable,
              studentId: profile.studentId,
              profilePhoto: profile.profilePhoto,
              wantsToLearnCourses: profile.wantsToLearnCourses,
              wantsToLearnSkills: profile.wantsToLearnSkills,
            }
          : null,
      };
    });

    const paginated = rows.slice(skip, skip + limit);

    return sendSuccess(res, {
      message: "Verifications retrieved.",
      data: {
        data: paginated,
        pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
      },
    });
  }),

  getVerificationDetail: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string };
    const user = await userRepository.findById(userId);
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

    return sendSuccess(res, {
      message: "Verification detail retrieved.",
      data: {
        student: {
          id: user.id,
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          profileImage: user.profileImage || profile?.profilePhoto || null,
          avatarUrl: user.profileImage || profile?.profilePhoto || null,
          accountStatus: user.accountStatus,
          verificationStatus: user.verificationStatus,
          setupProgress: user.setupProgress,
          isEmailVerified: user.isEmailVerified,
          studentVerified: user.studentVerified,
          createdAt: user.createdAt,
        },
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
        idVerification: {
          idPhotoUrl: user.idPhotoUrl,
          status: user.verificationStatus,
          submittedAt: user.updatedAt,
          rejectionReason: user.adminNotes,
        },
      },
    });
  }),

  approve: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string };
    const { notes } = req.body as { notes?: string };

    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    await userRepository.update(userId, {
      studentVerified: true,
      verificationStatus: "approved",
      setupProgress: "complete",
      adminNotes: notes,
    } as any);

    await notificationService.createNotification({
      userId,
      title: "ID Verification Approved",
      message: "Your student ID verification has been approved. You can now access all features.",
      type: "SESSION_ACCEPTED",
    });

    emitToUser(userId, "verification:approved", { verificationStatus: "approved", setupProgress: "complete" });

    sendSuccess(res, { message: "Student verification approved" });
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string };
    const { notes } = req.body as { notes?: string };

    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    await userRepository.update(userId, {
      studentVerified: false,
      verificationStatus: "rejected",
      setupProgress: "id_verification_pending",
      adminNotes: notes,
    } as any);

    await notificationService.createNotification({
      userId,
      title: "ID Verification Rejected",
      message: `Your student ID verification was rejected. Reason: ${notes || "Please review and resubmit."}`,
      type: "SESSION_ACCEPTED",
    });

    emitToUser(userId, "verification:rejected", { verificationStatus: "rejected", setupProgress: "id_verification_pending" });

    sendSuccess(res, { message: "Student verification rejected" });
  }),

  setInReview: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string };
    const { notes } = req.body as { notes?: string };

    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    await userRepository.update(userId, {
      verificationStatus: "in_review",
      setupProgress: "in_review",
      adminNotes: notes,
    } as any);

    emitToUser(userId, "verification:in_review", { verificationStatus: "in_review", setupProgress: "in_review" });

    sendSuccess(res, { message: "Student verification set to in-review" });
  }),
};
