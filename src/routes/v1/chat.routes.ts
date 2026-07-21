import { Router } from "express";
import { chatController } from "../../controllers/chat.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { authenticate, requireStudent } from "../../middlewares/authenticate";
import { requireChatMember, requireGroupAdmin } from "../../middlewares/chatAuth.middleware";
import { uploadChatImage } from "../../middlewares/upload.middleware";
import { conversationIdParamSchema, listMessagesQuerySchema, directChatSchema, createGroupSchema, addMembersSchema, updateGroupSchema, groupIdParamSchema, groupMemberParamSchema, sendGroupMessageSchema } from "../../validators/chat.validator";

export const chatRouter = Router();

/**
 * @openapi
 * /chat/conversations:
 *   get:
 *     summary: List the current user's conversations
 *     description: >
 *       Each conversation includes the other participant's basic info, a preview of the most
 *       recent message (if any), and an unread count. Sorted by most recent activity first.
 *       Real-time messaging itself happens over Socket.IO — see the README for the event contract.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The user's conversations.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/ConversationListItem' }
 *       401:
 *         description: Not authenticated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
chatRouter.get("/chat/conversations", authenticate, requireStudent, chatController.listConversations);

// Direct conversation message via REST
chatRouter.post(
  "/chat/:conversationId/messages",
  authenticate,
  requireStudent,
  validateRequest({ params: conversationIdParamSchema }),
  chatController.postMessage
);

// Create or return a direct conversation
chatRouter.post("/chat/direct", authenticate, requireStudent, validateRequest({ body: directChatSchema }), chatController.createDirect);

/**
 * @openapi
 * /chat/{conversationId}/messages:
 *   get:
 *     summary: Get a conversation's message history
 *     description: Only a participant in the conversation can read it. Paginated, most recent page 1.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated messages.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         data:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Message' }
 *                         pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       403:
 *         description: Caller is not a participant in this conversation.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Conversation not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
chatRouter.get(
  "/chat/:conversationId/messages",
  authenticate,
  requireStudent,
  validateRequest({ params: conversationIdParamSchema, query: listMessagesQuerySchema }),
  chatController.listMessages
);

/**
 * @openapi
 * /chat/upload-image:
 *   post:
 *     summary: Upload an image to attach to a chat message
 *     description: >
 *       Uploads to Cloudinary and returns the resulting URL. This does not send a message —
 *       pass the returned `imageUrl` in the `message:send` Socket.IO event to actually send it.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: JPEG, PNG, or WebP image.
 *     responses:
 *       200:
 *         description: Uploaded image URL.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         imageUrl: { type: string, format: uri }
 *       400:
 *         description: No file provided, wrong file type, or file too large.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Not authenticated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
chatRouter.post("/chat/upload-image", authenticate, requireStudent, uploadChatImage, chatController.uploadImage);

// Group chat routes
chatRouter.post(
  "/chat/groups",
  authenticate,
  requireStudent,
  validateRequest({ body: createGroupSchema }),
  chatController.createGroup
);

chatRouter.get("/chat/groups", authenticate, requireStudent, chatController.listGroups);

chatRouter.get(
  "/chat/groups/:chatId",
  authenticate,
  requireStudent,
  validateRequest({ params: groupIdParamSchema }),
  chatController.getGroup
);

chatRouter.post(
  "/chat/groups/:chatId/members",
  authenticate,
  requireStudent,
  requireGroupAdmin,
  validateRequest({ params: groupIdParamSchema, body: addMembersSchema }),
  chatController.addGroupMembers
);

chatRouter.delete(
  "/chat/groups/:chatId/members/:userId",
  authenticate,
  requireStudent,
  requireGroupAdmin,
  validateRequest({ params: groupMemberParamSchema }),
  chatController.removeGroupMember
);

chatRouter.patch(
  "/chat/groups/:chatId",
  authenticate,
  requireStudent,
  requireGroupAdmin,
  validateRequest({ params: groupIdParamSchema, body: updateGroupSchema }),
  chatController.updateGroup
);

chatRouter.post(
  "/chat/groups/:chatId/leave",
  authenticate,
  requireStudent,
  requireChatMember,
  validateRequest({ params: groupIdParamSchema }),
  chatController.leaveGroup
);

chatRouter.get(
  "/chat/groups/:chatId/messages",
  authenticate,
  requireStudent,
  requireChatMember,
  validateRequest({ params: groupIdParamSchema, query: listMessagesQuerySchema }),
  chatController.listGroupMessages
);

chatRouter.post(
  "/chat/groups/:chatId/messages",
  authenticate,
  requireStudent,
  requireChatMember,
  validateRequest({ params: groupIdParamSchema, body: sendGroupMessageSchema }),
  chatController.postGroupMessage
);

