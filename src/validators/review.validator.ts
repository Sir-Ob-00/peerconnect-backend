import { z } from "zod";
import { REVIEW_CONSTANTS } from "../constants/review.constants";

export const createReviewSchema = z.object({
  sessionId: z.string().uuid("sessionId must be a valid UUID"),
  rating: z
    .number({ invalid_type_error: "rating must be a number" })
    .int("rating must be a whole number")
    .min(REVIEW_CONSTANTS.RATING_MIN, `rating must be at least ${REVIEW_CONSTANTS.RATING_MIN}`)
    .max(REVIEW_CONSTANTS.RATING_MAX, `rating must be at most ${REVIEW_CONSTANTS.RATING_MAX}`),
  comment: z.string().trim().max(REVIEW_CONSTANTS.COMMENT_MAX_LENGTH).optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const reviewsByUserParamSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID"),
});
export type ReviewsByUserParamInput = z.infer<typeof reviewsByUserParamSchema>;

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(REVIEW_CONSTANTS.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(REVIEW_CONSTANTS.MAX_PAGE_SIZE)
    .default(REVIEW_CONSTANTS.DEFAULT_PAGE_SIZE),
});
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
