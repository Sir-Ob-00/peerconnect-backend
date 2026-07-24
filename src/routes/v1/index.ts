import { Router } from "express";
import { healthRouter } from "./health.routes";
import { authRouter } from "./auth.routes";
import { userRouter } from "./user.routes";
import { profileRouter } from "./profile.routes";
import { studentRouter } from "./student.routes";
import { sessionRouter } from "./session.routes";
import { chatRouter } from "./chat.routes";
import { reviewRouter } from "./review.routes";
import { notificationRouter } from "./notification.routes";
import { mobileAuthRouter } from "./mobileAuth.routes";
import { mobileSearchRouter } from "./mobileSearch.routes";
import { onboardingRouter } from "./onboarding.routes";
import { adminAuthRouter } from "./adminAuth.routes";
import { adminVerificationsRouter } from "./adminVerifications.routes";
import { adminStudentsRouter } from "./adminStudents.routes";
import { adminSessionsRouter } from "./adminSessions.routes";
import { adminReviewsRouter } from "./adminReviews.routes";
import { adminStatsRouter } from "./adminStats.routes";
import { adminDashboardRouter } from "./adminDashboard.routes";
import { adminUniversitiesRouter } from "./adminUniversities.routes";
import { adminDepartmentsRouter } from "./adminDepartments.routes";
import { adminProgrammesRouter } from "./adminProgrammes.routes";
import { adminLevelsRouter } from "./adminLevels.routes";
import { adminStudyGroupsRouter } from "./adminStudyGroups.routes";
import { adminReportsRouter } from "./adminReports.routes";
import { adminAuditLogsRouter } from "./adminAuditLogs.routes";
import { adminNotificationsRouter } from "./adminNotifications.routes";
import { adminAnnouncementsRouter } from "./adminAnnouncements.routes";
import { adminSettingsRouter } from "./adminSettings.routes";
import { adminAdminsRouter } from "./adminAdmins.routes";
import { adminChatsRouter } from "./adminChats.routes";
import { adminAnalyticsRouter } from "./adminAnalytics.routes";
import { frontendAuthRouter } from "./frontendAuth.routes";

export const v1Router = Router();

v1Router.use(healthRouter);
// Frontend-aligned auth endpoints (primary for mobile app)
v1Router.use(frontendAuthRouter);
// Mount mobile-specific routes under /mobile
v1Router.use("/mobile", mobileAuthRouter);
v1Router.use("/mobile", onboardingRouter);
v1Router.use("/mobile", mobileSearchRouter);
// Admin namespace
v1Router.use("/admin", adminDashboardRouter);
v1Router.use("/admin", adminAuthRouter);
v1Router.use("/admin", adminVerificationsRouter);
v1Router.use("/admin", adminStudentsRouter);
v1Router.use("/admin", adminSessionsRouter);
v1Router.use("/admin", adminReviewsRouter);
v1Router.use("/admin", adminStatsRouter);
v1Router.use("/admin", adminUniversitiesRouter);
v1Router.use("/admin", adminDepartmentsRouter);
v1Router.use("/admin", adminProgrammesRouter);
v1Router.use("/admin", adminLevelsRouter);
v1Router.use("/admin", adminStudyGroupsRouter);
v1Router.use("/admin", adminReportsRouter);
v1Router.use("/admin", adminAuditLogsRouter);
v1Router.use("/admin", adminNotificationsRouter);
v1Router.use("/admin", adminAnnouncementsRouter);
v1Router.use("/admin", adminSettingsRouter);
v1Router.use("/admin", adminAdminsRouter);
v1Router.use("/admin", adminChatsRouter);
v1Router.use("/admin", adminAnalyticsRouter);
// Keep existing authRouter for backward compatibility (legacy clients)
v1Router.use(authRouter);
v1Router.use(userRouter);
v1Router.use(profileRouter);
v1Router.use(studentRouter);
v1Router.use(sessionRouter);
v1Router.use(chatRouter);
v1Router.use(reviewRouter);
v1Router.use(notificationRouter);

// Future phases mount here.
