import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { prisma } from "../config/database";
import { userRepository } from "../repositories/user.repository";
import { sessionRepository } from "../repositories/session.repository";
import { reviewRepository } from "../repositories/review.repository";

export const adminStatsController = {
  getStats: asyncHandler(async (_req: Request, res: Response) => {
    const [
      totalStudents,
      totalSessions,
      totalReviews,
      pendingVerifications,
      sessionsByStatus,
      newStudentsLast30Days,
      avgRating,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT", deletedAt: null } }),
      prisma.session.count(),
      prisma.review.count(),
      userRepository.findByVerificationStatus("pending").then((users) => users.length),
      prisma.session.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.user.count({
        where: {
          role: "STUDENT",
          deletedAt: null,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      reviewRepository.findMany({ take: 1 }).then(() =>
        prisma.review.aggregate({ _avg: { rating: true } }).then((r) => r._avg.rating ?? 0)
      ),
    ]);

    const statusBreakdown: Record<string, number> = {};
    for (const row of sessionsByStatus) {
      statusBreakdown[row.status] = row._count.status;
    }

    sendSuccess(res, {
      message: "Dashboard stats retrieved.",
      data: {
        totalStudents,
        totalSessions,
        totalReviews,
        pendingVerifications,
        sessionsByStatus: statusBreakdown,
        newStudentsLast30Days,
        averageRating: avgRating,
      },
    });
  }),
};
