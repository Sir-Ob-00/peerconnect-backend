import type { ReviewWithReviewer } from "../repositories/review.repository";

export interface ReviewReviewer {
  id: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

export interface ReviewView {
  id: string;
  sessionId: string;
  reviewer: ReviewReviewer;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export function toReviewView(review: ReviewWithReviewer): ReviewView {
  return {
    id: review.id,
    sessionId: review.sessionId,
    reviewer: {
      id: review.reviewer.id,
      firstName: review.reviewer.firstName,
      lastName: review.reviewer.lastName,
      profileImage: review.reviewer.profileImage,
    },
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  };
}

export interface RatingSummaryView {
  averageRating: number;
  totalReviews: number;
}

/** Rounds to 1 decimal place for display (e.g. 4.3333... -> 4.3) without losing precision in the underlying calculation. */
export function toRatingSummaryView(averageRating: number, totalReviews: number): RatingSummaryView {
  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
  };
}
