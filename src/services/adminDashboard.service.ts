import { userRepository } from "../repositories/user.repository";
import { sessionRepository } from "../repositories/session.repository";
import { reviewRepository } from "../repositories/review.repository";
import { reportRepository } from "../repositories/report.repository";
import { chatRoomRepository } from "../repositories/chatRoom.repository";
import { prisma } from "../config/database";

export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalAdmins: number;
  totalSessions: number;
  totalReviews: number;
  totalReports: number;
  totalChatRooms: number;
  pendingVerifications: number;
  sessionsByStatus: Record<string, number>;
  avgRating: number;
  newStudentsLast7Days: number;
  newStudentsLast30Days: number;
  completedSessionsLast30Days: number;
  activeUsersLast30Days: number;
  reportsOpen: number;
  reportsResolvedThisMonth: number;
}

export const adminDashboardService = {
  async getStats(): Promise<DashboardStats> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalStudents,
      totalAdmins,
      totalSessions,
      totalReviews,
      totalReports,
      totalChatRooms,
      pendingVerifications,
      newStudentsLast7Days,
      newStudentsLast30Days,
      activeUsersLast30Days,
      reportsOpen,
      reportsResolvedThisMonth,
      completedSessionsLast30Days,
      avgRating,
    ] = await Promise.all([
      userRepository.count(),
      userRepository.count({ role: "STUDENT" }),
      userRepository.count({ role: "ADMIN" }),
      sessionRepository.count(),
      reviewRepository.findMany({ take: 1 }).then((r: any) => r.totalItems),
      reportRepository.findMany({ skip: 0, take: 1 }).then((r: any) => r.totalItems),
      chatRoomRepository.count(),
      userRepository.findByVerificationStatus("pending_approval").then((users) => users.length),
      userRepository.count({ role: "STUDENT", createdAt: { gte: sevenDaysAgo } }),
      userRepository.count({ role: "STUDENT", createdAt: { gte: thirtyDaysAgo } }),
      userRepository.count({ createdAt: { gte: thirtyDaysAgo } }),
      reportRepository.findMany({ status: "OPEN", skip: 0, take: 1 }).then((r: any) => r.totalItems),
      reportRepository.findMany({ status: "RESOLVED", skip: 0, take: 1 }).then((r: any) => r.totalItems),
      (prisma as any).session.count({ where: { status: "COMPLETED" } }),
      reviewRepository.getRatingSummary("").then((r: any) => r.averageRating ?? 0),
    ]);

    const sessionsByStatus: Record<string, number> = {};
    for (const status of ["PENDING", "ACCEPTED", "COMPLETED", "CANCELLED"] as const) {
      const count = await (prisma as any).session.count({ where: { status } });
      sessionsByStatus[status] = count;
    }

    return {
      totalUsers,
      totalStudents,
      totalAdmins,
      totalSessions,
      totalReviews,
      totalReports,
      totalChatRooms,
      pendingVerifications,
      sessionsByStatus,
      avgRating,
      newStudentsLast7Days,
      newStudentsLast30Days,
      completedSessionsLast30Days,
      activeUsersLast30Days,
      reportsOpen,
      reportsResolvedThisMonth,
    };
  },
};