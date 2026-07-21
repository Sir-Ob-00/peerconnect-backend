import type { Request, Response } from "express";
import { reviewService } from "../services/review.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import type { CreateReviewInput, ListReviewsQuery } from "../validators/review.validator";

export const reviewController = {
  createReview: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const body = req.body as CreateReviewInput;
    const review = await reviewService.createReview(req.user.id, body);
    sendSuccess(res, { statusCode: 201, message: "Review submitted successfully.", data: review });
  }),

  listForUser: asyncHandler(async (req: Request<{ userId: string }>, res: Response) => {
    const { page, limit } = req.query as unknown as ListReviewsQuery;
    const result = await reviewService.getReviewsForUser(req.params.userId, page, limit);
    sendSuccess(res, {
      message: "Reviews retrieved successfully.",
      data: { data: result.reviews, pagination: result.pagination, summary: result.summary },
    });
  }),
};
