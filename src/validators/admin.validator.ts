import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const adminStudentsQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  role: z.enum(["STUDENT", "ADMIN"]).optional(),
  verificationStatus: z.string().optional(),
  accountStatus: z.string().optional(),
});

export const adminUniversitiesQuerySchema = paginationQuerySchema.extend({ search: z.string().optional() });
export const adminDepartmentsQuerySchema = paginationQuerySchema.extend({
  universityId: z.string().uuid().optional(),
  search: z.string().optional(),
});
export const adminProgrammesQuerySchema = paginationQuerySchema.extend({
  universityId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  search: z.string().optional(),
});
export const adminLevelsQuerySchema = paginationQuerySchema.extend({ search: z.string().optional() });
export const adminReportsQuerySchema = paginationQuerySchema.extend({
  status: z.string().optional(),
  entityType: z.string().optional(),
  reporterId: z.string().uuid().optional(),
  reportedUserId: z.string().uuid().optional(),
});
export const adminAuditLogsQuerySchema = paginationQuerySchema.extend({
  actorId: z.string().uuid().optional(),
  entityType: z.string().optional(),
  action: z.string().optional(),
});
export const adminAnnouncementsQuerySchema = paginationQuerySchema.extend({
  isActive: z.string().optional(),
  target: z.string().optional(),
});
export const adminNotificationsQuerySchema = paginationQuerySchema.extend({ userId: z.string().uuid().optional() });
export const adminSettingsQuerySchema = paginationQuerySchema.extend({ category: z.string().optional() });
export const adminAdminsQuerySchema = paginationQuerySchema.extend({ search: z.string().optional() });
export const adminChatsQuerySchema = paginationQuerySchema.extend({ type: z.string().optional() });
export const adminStudyGroupsQuerySchema = paginationQuerySchema.extend({ search: z.string().optional() });
export const adminAnalyticsQuerySchema = paginationQuerySchema.extend({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const uuidParamSchema = z.object({ id: z.string().uuid("Must be a valid UUID") });
export const userIdParamSchema = z.object({ userId: z.string().uuid("Must be a valid UUID") });
export const adminUniversityParamSchema = z.object({ universityId: z.string().uuid("Must be a valid UUID") });
export const adminDepartmentParamSchema = z.object({ departmentId: z.string().uuid("Must be a valid UUID") });
export const adminProgrammeParamSchema = z.object({ programmeId: z.string().uuid("Must be a valid UUID") });
export const chatRoomParamSchema = z.object({ chatRoomId: z.string().uuid("Must be a valid UUID") });
export const conversationParamSchema = z.object({ conversationId: z.string().uuid("Must be a valid UUID") });

export const adminNotesSchema = z.object({ notes: z.string().max(500).optional() });
export const adminCreateUniversitySchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20),
  isActive: z.boolean().optional(),
});
export const adminCreateDepartmentSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().optional(),
  universityId: z.string().uuid(),
});
export const adminCreateProgrammeSchema = z.object({
  name: z.string().min(2).max(100),
  universityId: z.string().uuid(),
  departmentId: z.string().uuid(),
});
export const adminCreateLevelSchema = z.object({
  name: z.string().min(2).max(50),
  code: z.string().min(2).max(20),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});
export const adminUpdateLevelSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  code: z.string().min(2).max(20).optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});
export const adminCreateReportSchema = z.object({
  reporterId: z.string().uuid(),
  reportedUserId: z.string().uuid(),
  entityType: z.enum(["USER", "MESSAGE", "REVIEW", "SESSION", "CHAT_ROOM"]),
  entityId: z.string(),
  reason: z.string().min(5),
  description: z.string().optional(),
});
export const adminUpdateReportSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "DISMISSED"]),
  adminNotes: z.string().max(500).optional(),
});
export const adminCreateAnnouncementSchema = z.object({
  title: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
  target: z.enum(["ALL", "UNIVERSITY", "DEPARTMENT", "PROGRAMME", "LEVEL"]).optional(),
  targetId: z.string().optional(),
  scheduledAt: z.string().optional(),
  expiresAt: z.string().optional(),
});
export const adminCreateSettingSchema = z.object({
  key: z.string().min(2).max(100),
  value: z.string(),
  type: z.enum(["STRING", "NUMBER", "BOOLEAN", "JSON"]).optional(),
  category: z.enum(["GENERAL", "EMAIL", "SECURITY", "REGISTRATION", "FEATURES"]).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
});
export const adminUpdateSettingSchema = z.object({
  value: z.string(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
});
export const adminCreateAdminSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "STUDENT"]).optional(),
});
export const levelReorderSchema = z.object({ items: z.array(z.object({ id: z.string().uuid(), sortOrder: z.coerce.number().int() })) });
export const notificationBroadcastSchema = z.object({ title: z.string().min(2), message: z.string().min(2) });

export const adminSessionsQuerySchema = paginationQuerySchema.extend({
  status: z.string().optional(),
  requesterId: z.string().uuid().optional(),
  receiverId: z.string().uuid().optional(),
  skill: z.string().optional(),
});
export const adminReviewsQuerySchema = paginationQuerySchema.extend({
  userId: z.string().uuid().optional(),
  reviewerId: z.string().uuid().optional(),
  receiverId: z.string().uuid().optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  maxRating: z.coerce.number().int().min(1).max(5).optional(),
});

export type AdminStudentsQuery = z.infer<typeof adminStudentsQuerySchema>;
export type AdminUniversitiesQuery = z.infer<typeof adminUniversitiesQuerySchema>;
export type AdminDepartmentsQuery = z.infer<typeof adminDepartmentsQuerySchema>;
export type AdminProgrammesQuery = z.infer<typeof adminProgrammesQuerySchema>;
export type AdminLevelsQuery = z.infer<typeof adminLevelsQuerySchema>;
export type AdminReportsQuery = z.infer<typeof adminReportsQuerySchema>;
export type AdminAuditLogsQuery = z.infer<typeof adminAuditLogsQuerySchema>;
export type AdminAnnouncementsQuery = z.infer<typeof adminAnnouncementsQuerySchema>;
export type AdminNotificationsQuery = z.infer<typeof adminNotificationsQuerySchema>;
export type AdminSettingsQuery = z.infer<typeof adminSettingsQuerySchema>;
export type AdminAdminsQuery = z.infer<typeof adminAdminsQuerySchema>;
export type AdminStudyGroupsQuery = z.infer<typeof adminStudyGroupsQuerySchema>;
export type AdminAnalyticsQuery = z.infer<typeof adminAnalyticsQuerySchema>;
export type AdminSessionsQuery = z.infer<typeof adminSessionsQuerySchema>;
export type AdminReviewsQuery = z.infer<typeof adminReviewsQuerySchema>;
