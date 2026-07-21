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

export const adminSessionsQuerySchema = paginationQuerySchema.extend({
  status: z.string().optional(),
  requesterId: z.string().optional(),
  receiverId: z.string().optional(),
  skill: z.string().optional(),
});

export const adminReviewsQuerySchema = paginationQuerySchema.extend({
  reviewerId: z.string().optional(),
  receiverId: z.string().optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  maxRating: z.coerce.number().int().min(1).max(5).optional(),
});

export type AdminStudentsQuery = z.infer<typeof adminStudentsQuerySchema>;
export type AdminSessionsQuery = z.infer<typeof adminSessionsQuerySchema>;
export type AdminReviewsQuery = z.infer<typeof adminReviewsQuerySchema>;
