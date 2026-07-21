import { z } from "zod";
import { CHAT_CONSTANTS } from "../constants/chat.constants";

export const conversationIdParamSchema = z.object({
  conversationId: z.string().uuid("conversationId must be a valid UUID"),
});
export type ConversationIdParamInput = z.infer<typeof conversationIdParamSchema>;

export const listMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(CHAT_CONSTANTS.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(CHAT_CONSTANTS.MAX_PAGE_SIZE).default(CHAT_CONSTANTS.DEFAULT_PAGE_SIZE),
});
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;

/**
 * Validates a `message:send` socket payload. Not wired through the REST
 * `validateRequest` middleware (this is a socket event, not an HTTP route) —
 * the socket handler calls `.safeParse` directly. Requires at least one of
 * content/imageUrl, since an empty message is never meaningful.
 */
export const sendMessageSocketSchema = z
  .object({
    conversationId: z.string().uuid().optional(),
    receiverId: z.string().uuid().optional(),
    content: z.string().trim().min(1).max(CHAT_CONSTANTS.CONTENT_MAX_LENGTH).optional(),
    imageUrl: z.string().url().optional(),
  })
  .refine((data) => Boolean(data.content) || Boolean(data.imageUrl), {
    message: "Provide message content, an image, or both.",
  })
  .refine((data) => Boolean(data.conversationId) || Boolean(data.receiverId), {
    message: "Provide either conversationId (existing conversation) or receiverId (start a new one).",
  });
export type SendMessageSocketInput = z.infer<typeof sendMessageSocketSchema>;

export const conversationRoomSocketSchema = z.object({
  conversationId: z.string().uuid(),
});
export type ConversationRoomSocketInput = z.infer<typeof conversationRoomSocketSchema>;

export const markReadSocketSchema = z.object({
  conversationId: z.string().uuid(),
});
export type MarkReadSocketInput = z.infer<typeof markReadSocketSchema>;

// REST schemas for new group/direct endpoints
export const directChatSchema = z.object({ userId: z.string().uuid() });
export type DirectChatInput = z.infer<typeof directChatSchema>;

export const createGroupSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  members: z.array(z.string().uuid()).optional(),
});
export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const addMembersSchema = z.object({ members: z.array(z.string().uuid()) });
export type AddMembersInput = z.infer<typeof addMembersSchema>;

export const updateGroupSchema = z.object({ name: z.string().trim().min(1).optional(), description: z.string().optional(), imageUrl: z.string().url().optional() });
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

export const groupIdParamSchema = z.object({ chatId: z.string().uuid() });
export type GroupIdParamInput = z.infer<typeof groupIdParamSchema>;

export const groupMemberParamSchema = z.object({ chatId: z.string().uuid(), userId: z.string().uuid() });
export type GroupMemberParamInput = z.infer<typeof groupMemberParamSchema>;

export const groupRoomSocketSchema = z.object({ chatId: z.string().uuid() });
export type GroupRoomSocketInput = z.infer<typeof groupRoomSocketSchema>;

export const sendGroupMessageSchema = z.object({ content: z.string().trim().min(1) });
export type SendGroupMessageInput = z.infer<typeof sendGroupMessageSchema>;

