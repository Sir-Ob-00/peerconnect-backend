import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { userRepository } from "../repositories/user.repository";
import { studentProfileRepository } from "../repositories/studentProfile.repository";
import { ApiError } from "../utils/ApiError";
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

    const rows = await Promise.all(
      items.map(async (u) => {
        const profile = await studentProfileRepository.findByUserId(u.id);
        return {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          role: u.role,
          accountStatus: u.accountStatus,
          isEmailVerified: u.isEmailVerified,
          studentVerified: u.studentVerified,
          verificationStatus: u.verificationStatus,
          setupProgress: u.setupProgress,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          profile: profile
            ? {
                university: profile.university,
                department: profile.department,
                level: profile.level,
                skills: profile.skills,
                learningInterests: profile.learningInterests,
                isAvailable: profile.isAvailable,
                studentId: profile.studentId,
              }
            : null,
        };
      })
    );

    sendSuccess(res, {
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

    sendSuccess(res, {
      message: "Student retrieved.",
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        profileImage: user.profileImage,
        isEmailVerified: user.isEmailVerified,
        studentVerified: user.studentVerified,
        verificationStatus: user.verificationStatus,
        setupProgress: user.setupProgress,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
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
              profilePhoto: profile.profilePhoto,
              studentId: profile.studentId,
            }
          : null,
      },
    });
  }),
};
