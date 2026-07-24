import type { Prisma, Review, User } from "@prisma/client";
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

  async getAverageRating(): Promise<number> {
    const result = await prisma.review.aggregate({
      _avg: { rating: true },
    });
    return result._avg.rating ?? 0;
  },

  async findMany(filters: {
    reviewerId?: string;
    receiverId?: string;
    minRating?: number;
    maxRating?: number;
    skip?: number;
    take?: number;
  }): Promise<ListResult> {
    const where: Prisma.ReviewWhereInput = {};
    if (filters.reviewerId) where.reviewerId = filters.reviewerId;
    if (filters.receiverId) where.receiverId = filters.receiverId;
    if (filters.minRating !== undefined || filters.maxRating !== undefined) {
      where.rating = {};
      if (filters.minRating !== undefined) where.rating.gte = filters.minRating;
      if (filters.maxRating !== undefined) where.rating.lte = filters.maxRating;
    }

    const [items, totalItems] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { reviewer: { select: reviewerSelect } },
        orderBy: { createdAt: "desc" },
        skip: filters.skip ?? 0,
        take: filters.take ?? 10,
      }),
      prisma.review.count({ where }),
    ]);
    return { items, totalItems };
  },
};
