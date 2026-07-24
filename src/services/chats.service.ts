import { ApiError } from "../utils/ApiError";
import { conversationRepository } from "../repositories/conversation.repository";
import { messageRepository } from "../repositories/message.repository";

export const chatsService = {
  async listAllConversations(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const conversations = await conversationRepository.listAll(skip, limit + 1);
    const totalItems = await conversationRepository.count();
    const hasMore = conversations.length > limit;
    const items = hasMore ? conversations.slice(0, limit) : conversations;

    return {
      data: items.map((c) => ({
        id: c.id,
        userOneId: c.userOneId,
        userOne: c.userOne,
        userTwoId: c.userTwoId,
        userTwo: c.userTwo,
        createdAt: c.createdAt,
      })),
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
    };
  },

  async getConversationMessages(conversationId: string, page = 1, limit = 20) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw ApiError.notFound("Conversation not found.");

    const skip = (page - 1) * limit;
    const result = await messageRepository.listByConversation({ conversationId, skip, take: limit });

    return {
      data: result.items.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        content: m.content,
        imageUrl: m.imageUrl,
        isRead: m.isRead,
        createdAt: m.createdAt,
      })),
      pagination: { page, limit, totalItems: result.totalItems, totalPages: Math.ceil(result.totalItems / limit) },
    };
  },

  async deleteMessage(messageId: string) {
    const message = await messageRepository.findById(messageId);
    if (!message) throw ApiError.notFound("Message not found.");

    return messageRepository.delete(messageId);
  },

  async getFlaggedMessages(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const result = await messageRepository.listAll(skip, limit);

    return {
      data: result.items.map((m) => ({
        id: m.id,
        content: m.content,
        imageUrl: m.imageUrl,
        senderId: m.senderId,
        conversationId: m.conversationId,
        createdAt: m.createdAt,
      })),
      pagination: { page, limit, totalItems: result.totalItems, totalPages: Math.ceil(result.totalItems / limit) },
    };
  },
};
