import { z } from "zod";
import { DISCOVERY_CONSTANTS } from "../constants/discovery.constants";

export const searchStudentsQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  department: z.string().trim().min(1).max(100).optional(),
  /** Comma-separated list of skills, e.g. "React,Node.js" — split into an array in the service layer. */
  skills: z.string().trim().min(1).max(300).optional(),
  page: z.coerce.number().int().min(1).default(DISCOVERY_CONSTANTS.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(DISCOVERY_CONSTANTS.MAX_PAGE_SIZE)
    .default(DISCOVERY_CONSTANTS.DEFAULT_PAGE_SIZE),
});
export type SearchStudentsQuery = z.infer<typeof searchStudentsQuerySchema>;

export const recommendationsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(DISCOVERY_CONSTANTS.MAX_RECOMMENDATION_LIMIT)
    .default(DISCOVERY_CONSTANTS.DEFAULT_RECOMMENDATION_LIMIT),
});
export type RecommendationsQuery = z.infer<typeof recommendationsQuerySchema>;
