import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { chatsService } from "../services/chats.service";

export const adminChatsController = {
  listConversations: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);

    const result = await chatsService.listAllConversations(page, limit);
    sendSuccess(res, { message: "Conversations retrieved.", data: result });
  }),

  getMessages: asyncHandler(async (req: Request, res: Response) => {
    const { conversationId } = req.params as { conversationId: string };
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "20", 10);

    const result = await chatsService.getConversationMessages(conversationId, page, limit);
    sendSuccess(res, { message: "Messages retrieved.", data: result });
  }),

  deleteMessage: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const message = await chatsService.deleteMessage(id);
    sendSuccess(res, { message: "Message deleted.", data: message });
  }),

  flagged: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "20", 10);

    const result = await chatsService.getFlaggedMessages(page, limit);
    sendSuccess(res, { message: "Flagged messages retrieved.", data: result });
  }),
};
