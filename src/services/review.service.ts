import { reviewRepository } from "../repositories/review.repository";
import { sessionRepository } from "../repositories/session.repository";
import { userRepository } from "../repositories/user.repository";
import { toPaginationMeta, type PaginationMeta } from "../dtos/studentDiscovery.dto";
import { toRatingSummaryView, toReviewView, type RatingSummaryView, type ReviewView } from "../dtos/review.dto";
import { ApiError } from "../utils/ApiError";
import type { CreateReviewInput } from "../validators/review.validator";

export interface ReviewsForUserResult {
  reviews: ReviewView[];
  pagination: PaginationMeta;
  summary: RatingSummaryView;
}

export const reviewService = {
  async createReview(reviewerId: string, input: CreateReviewInput): Promise<ReviewView> {
    const session = await sessionRepository.findById(input.sessionId);
    if (!session) {
      throw ApiError.notFound("Session not found.");
    }

    if (session.status !== "COMPLETED") {
      throw ApiError.badRequest("Only completed sessions can be reviewed.");
    }

    if (session.requesterId !== reviewerId && session.receiverId !== reviewerId) {
      throw ApiError.forbidden("You can only review sessions you participated in.");
    }

    const receiverId = session.requesterId === reviewerId ? session.receiverId : session.requesterId;

    // Defense-in-depth: a session's two participants are always distinct
    // users (enforced back in Phase 5's request-a-session rule), so this
    // should be unreachable — but the spec states the rule explicitly, so
    // it's asserted explicitly too rather than just relied upon implicitly.
    if (receiverId === reviewerId) {
      throw ApiError.badRequest("You cannot review yourself.");
    }

    const existingReview = await reviewRepository.findBySessionId(input.sessionId);
    if (existingReview) {
      throw ApiError.conflict("This session has already been reviewed.");
    }

    const created = await reviewRepository.create({
      sessionId: input.sessionId,
      reviewerId,
      receiverId,
      rating: input.rating,
      comment: input.comment,
    });

    return toReviewView(created);
  },

  async getReviewsForUser(userId: string, page: number, limit: number): Promise<ReviewsForUserResult> {
    const user = await userRepository.findActiveById(userId);
    if (!user) {
      throw ApiError.notFound("User not found.");
    }

    const [{ items, totalItems }, summary] = await Promise.all([
      reviewRepository.listByReceiver({ receiverId: userId, skip: (page - 1) * limit, take: limit }),
      reviewRepository.getRatingSummary(userId),
    ]);

    return {
      reviews: items.map(toReviewView),
      pagination: toPaginationMeta(page, limit, totalItems),
      summary: toRatingSummaryView(summary.averageRating, summary.totalReviews),
    };
  },
};
