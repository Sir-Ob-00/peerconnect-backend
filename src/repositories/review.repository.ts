import type { Review, User } from "@prisma/client";
import { prisma } from "../config/database";

const reviewerSelect = {
  id: true,
  firstName: true,
  lastName: true,
  profileImage: true,
} as const;

export interface ReviewWithReviewer extends Review {
  reviewer: Pick<User, "id" | "firstName" | "lastName" | "profileImage">;
}

interface CreateReviewData {
  sessionId: string;
  reviewerId: string;
  receiverId: string;
  rating: number;
  comment?: string;
}

interface ListParams {
  receiverId: string;
  skip: number;
  take: number;
}

interface ListResult {
  items: ReviewWithReviewer[];
  totalItems: number;
}

interface RatingSummary {
  averageRating: number;
  totalReviews: number;
}

export const reviewRepository = {
  create(data: CreateReviewData): Promise<ReviewWithReviewer> {
    return prisma.review.create({ data, include: { reviewer: { select: reviewerSelect } } });
  },

  findBySessionId(sessionId: string): Promise<Review | null> {
    return prisma.review.findUnique({ where: { sessionId } });
  },

  async listByReceiver({ receiverId, skip, take }: ListParams): Promise<ListResult> {
    const where = { receiverId };
    const [items, totalItems] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { reviewer: { select: reviewerSelect } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.review.count({ where }),
    ]);
    return { items, totalItems };
  },

  /** Single aggregate query — never fetches every row just to average them in application code. */
  async getRatingSummary(receiverId: string): Promise<RatingSummary> {
    const result = await prisma.review.aggregate({
      where: { receiverId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      averageRating: result._avg.rating ?? 0,
      totalReviews: result._count.rating,
    };
  },
};
