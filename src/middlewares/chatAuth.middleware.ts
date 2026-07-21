import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { chatMemberRepository } from "../repositories/chatMember.repository";

export async function requireChatMember(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(ApiError.unauthorized("Authentication required."));
  const chatId = (req.params as any).chatId || (req.params as any).conversationId;
  if (!chatId) return next(ApiError.badRequest("chatId is required in params."));
  const member = await chatMemberRepository.findMember(chatId, req.user.id);
  if (!member) return next(ApiError.forbidden("You are not a member of this chat."));
  // attach for downstream use
  (req as any).chatMember = member;
  next();
}

export async function requireGroupAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(ApiError.unauthorized("Authentication required."));
  const chatId = (req.params as any).chatId;
  if (!chatId) return next(ApiError.badRequest("chatId is required in params."));
  const member = await chatMemberRepository.findMember(chatId, req.user.id);
  if (!member) return next(ApiError.forbidden("You are not a member of this chat."));
  if (member.role !== "ADMIN") return next(ApiError.forbidden("Admin privileges required."));
  (req as any).chatMember = member;
  next();
}
