import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { reviewRepository } from "../repositories/review.repository";
import { ApiError } from "../utils/ApiError";
import type { AdminReviewsQuery } from "../validators/admin.validator";

export const adminReviewsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as AdminReviewsQuery;
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const { items, totalItems } = await reviewRepository.findMany({
      reviewerId: query.reviewerId,
      receiverId: query.receiverId,
      minRating: query.minRating,
      maxRating: query.maxRating,
      skip,
      take: limit,
    });

    sendSuccess(res, {
      message: "Reviews retrieved.",
      data: {
        data: items.map((r) => ({
          id: r.id,
          sessionId: r.sessionId,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          reviewer: {
            id: r.reviewer.id,
            firstName: r.reviewer.firstName,
            lastName: r.reviewer.lastName,
            profileImage: r.reviewer.profileImage,
          },
          receiverId: r.receiverId,
        })),
        pagination: {
          page,
          limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
        },
      },
    });
  }),

  getByUserId: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const skip = (page - 1) * limit;

    const user = await (await import("../repositories/user.repository")).userRepository.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    const { items, totalItems } = await reviewRepository.findMany({
      receiverId: userId,
      skip,
      take: limit,
    });

    const summary = await reviewRepository.getRatingSummary(userId);

    sendSuccess(res, {
      message: "Reviews for user retrieved.",
      data: {
        user: {
          id: user.id,
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
        summary,
        data: items.map((r) => ({
          id: r.id,
          sessionId: r.sessionId,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          reviewer: {
            id: r.reviewer.id,
            firstName: r.reviewer.firstName,
            lastName: r.reviewer.lastName,
            profileImage: r.reviewer.profileImage,
          },
        })),
        pagination: {
          page,
          limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
        },
      },
    });
  }),
};
