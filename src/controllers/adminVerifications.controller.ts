import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { userRepository } from "../repositories/user.repository";
import { studentProfileRepository } from "../repositories/studentProfile.repository";
import { emitToUser } from "../sockets/socketEmitter";

export const adminVerificationsController = {
  listPending: asyncHandler(async (req: Request, res: Response) => {
    const status = (req.query.status as string) || "pending_approval";
    const users = await (userRepository as any).findByVerificationStatus(status);

    const rows = await Promise.all(
      users.map(async (u: any) => {
        const profile = await studentProfileRepository.findByUserId(u.id);
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
          profileImage: u.profileImage,
          idPhotoUrl: u.idPhotoUrl ?? null,
          adminNotes: u.adminNotes ?? null,
          submittedAt: u.updatedAt,
          profile: profile
            ? {
                university: profile.university,
                department: profile.department,
                level: profile.level,
                skills: profile.skills,
                learningInterests: profile.learningInterests,
                bio: profile.bio,
                availability: profile.availability,
                isAvailable: profile.isAvailable,
                studentId: profile.studentId,
                profilePhoto: profile.profilePhoto,
              }
            : null,
        };
      })
    );

    sendSuccess(res, { message: "Verifications retrieved.", data: rows });
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
      adminNotes: notes,
    } as any);

    emitToUser(userId, "verification:rejected", { verificationStatus: "rejected" });

    sendSuccess(res, { message: "Student verification rejected" });
  }),

  setInReview: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string };
    const { notes } = req.body as { notes?: string };

    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    await userRepository.update(userId, {
      verificationStatus: "pending_approval",
      setupProgress: "pending_approval",
      adminNotes: notes,
    } as any);

    emitToUser(userId, "verification:in_review", { verificationStatus: "pending_approval", setupProgress: "pending_approval" });

    sendSuccess(res, { message: "Student verification set to in-review" });
  }),
};
