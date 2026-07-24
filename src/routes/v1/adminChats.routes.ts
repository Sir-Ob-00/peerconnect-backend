import { Router } from "express";
import { z } from "zod";
import { adminChatsController } from "../../controllers/adminChats.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { conversationParamSchema, uuidParamSchema } from "../../validators/common.validator";

export const adminChatsRouter = Router();

adminChatsRouter.get(
  "/chats",
  authenticate,
  requireAdmin,
  adminChatsController.listConversations
);

adminChatsRouter.get(
  "/chats/:conversationId/messages",
  authenticate,
  requireAdmin,
  validateRequest({ params: conversationParamSchema }),
  adminChatsController.getMessages
);

adminChatsRouter.delete(
  "/chats/messages/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: z.object({ id: uuidParamSchema.shape.id }) }),
  adminChatsController.deleteMessage
);

adminChatsRouter.get(
  "/chats/flagged",
  authenticate,
  requireAdmin,
  adminChatsController.flagged
);
