import { z } from "zod";

/** For any future route with a URL param like /users/:id — kept here so it's not redefined per feature. */
export const uuidParamSchema = z.object({
  id: z.string().uuid("Must be a valid UUID"),
});
export const userIdParamSchema = z.object({
  userId: z.string().uuid("Must be a valid UUID"),
});
export const chatRoomParamSchema = z.object({
  chatRoomId: z.string().uuid("Must be a valid UUID"),
});
export const conversationParamSchema = z.object({
  conversationId: z.string().uuid("Must be a valid UUID"),
});
export type UuidParamInput = z.infer<typeof uuidParamSchema>;
export type UserIdParamInput = z.infer<typeof userIdParamSchema>;
export type ChatRoomParamInput = z.infer<typeof chatRoomParamSchema>;
export type ConversationParamInput = z.infer<typeof conversationParamSchema>;
