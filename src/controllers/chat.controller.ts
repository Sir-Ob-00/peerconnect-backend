import type { Request, Response } from "express";
import { chatService } from "../services/chat.service";
import { uploadChatImageBuffer } from "../utils/cloudinaryUpload.util";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import type { ListMessagesQuery } from "../validators/chat.validator";
import { toChatRoomView, toChatMessageView } from "../dtos/chat.dto";

function requireUserId(req: Request): string {
  if (!req.user) throw ApiError.unauthorized("Authentication required.");
  return req.user.id;
}

export const chatController = {
  listConversations: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const conversations = await chatService.listConversations(userId);
    sendSuccess(res, { message: "Conversations retrieved successfully.", data: conversations });
  }),

  listMessages: asyncHandler(async (req: Request<{ conversationId: string }>, res: Response) => {
    const userId = requireUserId(req);
    const { page, limit } = req.query as unknown as ListMessagesQuery;
    const result = await chatService.listMessages(req.params.conversationId, userId, page, limit);
    sendSuccess(res, {
      message: "Messages retrieved successfully.",
      data: { data: result.messages, pagination: result.pagination },
    });
  }),

  // POST /chat/:conversationId/messages (direct conversation message via REST)
  postMessage: asyncHandler(async (req: Request<{ conversationId: string }>, res: Response) => {
    const userId = requireUserId(req);
    const { content } = req.body as { content?: string };
    const result = await chatService.sendMessage(userId, { conversationId: req.params.conversationId, content });
    sendSuccess(res, { message: "Message sent.", data: { message: result.message, conversationId: result.conversationId } });
  }),

  uploadImage: asyncHandler(async (req: Request, res: Response) => {
    requireUserId(req);
    if (!req.file) {
      throw ApiError.badRequest('No image file provided. Attach one under the "image" field.');
    }
    const uploaded = await uploadChatImageBuffer(req.file.buffer);
    sendSuccess(res, { message: "Image uploaded successfully.", data: { imageUrl: uploaded.secureUrl } });
  }),

  // Direct chat helper (POST /chat/direct)
  createDirect: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { userId: receiverId } = req.body as { userId: string };
    const result = await chatService.getOrCreateConversation(userId, receiverId);
    sendSuccess(res, { message: "Conversation retrieved.", data: { conversation: result.conversation, isNew: result.isNew } });
  }),

  // Group endpoints
  createGroup: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { name, description, imageUrl, members } = req.body as { name: string; description?: string; imageUrl?: string; members?: string[] };
    const room = await chatService.createGroup(userId, { name, description, imageUrl, members });
    sendSuccess(res, { message: "Group created.", data: toChatRoomView(room) });
  }),

  listGroups: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const rooms = await chatService.listGroupsForUser(userId);
    sendSuccess(res, { message: "Groups retrieved.", data: rooms.map(toChatRoomView) });
  }),

  getGroup: asyncHandler(async (req: Request<{ chatId: string }>, res: Response) => {
    const userId = requireUserId(req);
    const room = await chatService.getGroupOrThrow(req.params.chatId, userId);
    sendSuccess(res, { message: "Group retrieved.", data: toChatRoomView(room) });
  }),

  addGroupMembers: asyncHandler(async (req: Request<{ chatId: string }>, res: Response) => {
    const actorId = requireUserId(req);
    const memberIds = (req.body as { members: string[] }).members || [];
    const added = await chatService.addGroupMembers(req.params.chatId, actorId, memberIds);
    sendSuccess(res, { message: "Members added.", data: added });
  }),

  removeGroupMember: asyncHandler(async (req: Request<{ chatId: string; userId: string }>, res: Response) => {
    const actorId = requireUserId(req);
    const { userId } = req.params;
    await chatService.removeGroupMember(req.params.chatId, actorId, userId);
    sendSuccess(res, { message: "Member removed." });
  }),

  updateGroup: asyncHandler(async (req: Request<{ chatId: string }>, res: Response) => {
    const actorId = requireUserId(req);
    const { name, description, imageUrl } = req.body as { name?: string; description?: string; imageUrl?: string };
    const updated = await chatService.updateGroup(req.params.chatId, actorId, { name, description, imageUrl });
    sendSuccess(res, { message: "Group updated.", data: updated });
  }),

  leaveGroup: asyncHandler(async (req: Request<{ chatId: string }>, res: Response) => {
    const userId = requireUserId(req);
    await chatService.leaveGroup(req.params.chatId, userId);
    sendSuccess(res, { message: "Left group." });
  }),

  postGroupMessage: asyncHandler(async (req: Request<{ chatId: string }>, res: Response) => {
    const userId = requireUserId(req);
    const { content } = req.body as { content?: string };
    const created = await chatService.sendGroupMessage(userId, req.params.chatId, content);
    sendSuccess(res, { message: "Message sent.", data: toChatMessageView(created) });
  }),

  listGroupMessages: asyncHandler(async (req: Request<{ chatId: string }>, res: Response) => {
    const userId = requireUserId(req);
    const { page, limit } = req.query as unknown as ListMessagesQuery;
    const result = await chatService.listGroupMessages(req.params.chatId, userId, page, limit);
    sendSuccess(res, { message: "Messages retrieved.", data: { data: result.messages.map(toChatMessageView), pagination: result.pagination } });
  }),
};
