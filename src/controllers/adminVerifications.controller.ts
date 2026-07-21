import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { userRepository } from "../repositories/user.repository";
import { studentProfileRepository } from "../repositories/studentProfile.repository";

export const adminVerificationsController = {
  listPending: asyncHandler(async (req: Request, res: Response) => {
    // Find users where verificationStatus = 'pending'
    const users = await (userRepository as any).findByVerificationStatus("pending");

    const rows = await Promise.all(
      users.map(async (u: any) => {
        const profile = await studentProfileRepository.findByUserId(u.id);
        return {
          userId: u.id,
          fullName: `${u.firstName} ${u.lastName}`,
          email: u.email,
          studentId: profile?.studentId ?? null,
          department: profile?.department ?? null,
          level: profile?.level ?? null,
          idPhotoUrl: u.idPhotoUrl ?? null,
          submittedAt: u.updatedAt,
        };
      })
    );

    sendSuccess(res, { message: "Pending verifications retrieved.", data: rows });
  }),

  approve: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string };

    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    await userRepository.update(userId, {
      studentVerified: true,
      verificationStatus: "approved",
      setupProgress: "complete",
    } as any);

    sendSuccess(res, { message: "Student verification approved" });
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string };
    const { reason } = req.body as { reason?: string };

    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    await userRepository.update(userId, {
      studentVerified: false,
      verificationStatus: "rejected",
    } as any);

    // optional: store reason somewhere — left as future work

    sendSuccess(res, { message: "Student verification rejected" });
  }),
};