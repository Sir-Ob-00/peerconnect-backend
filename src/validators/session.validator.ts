import { z } from "zod";
import { SESSION_CONSTANTS } from "../constants/session.constants";

export const createSessionSchema = z.object({
  receiverId: z.string().uuid("receiverId must be a valid UUID"),
  skill: z
    .string()
    .trim()
    .min(1, "Skill is required")
    .max(SESSION_CONSTANTS.SKILL_MAX_LENGTH, `Skill must be at most ${SESSION_CONSTANTS.SKILL_MAX_LENGTH} characters`),
  message: z.string().trim().max(SESSION_CONSTANTS.MESSAGE_MAX_LENGTH).optional(),
  scheduledDate: z.coerce.date({
    errorMap: () => ({ message: "scheduledDate must be a valid date" }),
  }),
}).refine((data) => data.scheduledDate.getTime() > Date.now(), {
  message: "scheduledDate must be in the future",
  path: ["scheduledDate"],
});
export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const listSessionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(SESSION_CONSTANTS.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(SESSION_CONSTANTS.MAX_PAGE_SIZE)
    .default(SESSION_CONSTANTS.DEFAULT_PAGE_SIZE),
});
export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;

export const sessionIdParamSchema = z.object({
  id: z.string().uuid("Must be a valid UUID"),
});
export type SessionIdParamInput = z.infer<typeof sessionIdParamSchema>;
