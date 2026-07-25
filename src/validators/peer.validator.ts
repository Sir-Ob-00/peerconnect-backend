import { z } from "zod";
import { DISCOVERY_CONSTANTS } from "../constants/discovery.constants";

export const peersQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  universityId: z.string().trim().uuid().optional(),
  departmentId: z.string().trim().optional(),
  programmeId: z.string().trim().optional(),
  levelId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(DISCOVERY_CONSTANTS.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(DISCOVERY_CONSTANTS.MAX_PAGE_SIZE)
    .default(DISCOVERY_CONSTANTS.DEFAULT_PAGE_SIZE),
});
export type PeersQuery = z.infer<typeof peersQuerySchema>;

export const recommendedPeersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DISCOVERY_CONSTANTS.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(DISCOVERY_CONSTANTS.MAX_RECOMMENDATION_LIMIT)
    .default(DISCOVERY_CONSTANTS.DEFAULT_RECOMMENDATION_LIMIT),
});
export type RecommendedPeersQuery = z.infer<typeof recommendedPeersQuerySchema>;

export const connectionRequestSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});
export type ConnectionRequestInput = z.infer<typeof connectionRequestSchema>;

export const connectionActionSchema = z.object({
  connectionId: z.string().uuid("Invalid connection ID"),
});
export type ConnectionActionInput = z.infer<typeof connectionActionSchema>;

export const peerIdParamSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});
export type PeerIdParam = z.infer<typeof peerIdParamSchema>;

export const blockUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  reason: z.string().trim().max(500).optional(),
});
export type BlockUserInput = z.infer<typeof blockUserSchema>;
