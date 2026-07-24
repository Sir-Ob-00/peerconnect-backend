import type { Message, Prisma } from "@prisma/client";
import { prisma } from "../config/database";

interface CreateMessageData {
  conversationId: string;
  senderId: string;
  content?: string;
  imageUrl?: string;
}

interface ListParams {
  conversationId: string;
  skip: number;
  take: number;
}

interface ListResult {
  items: Message[];
  totalItems: number;
}

export const messageRepository = {
  create(data: CreateMessageData): Promise<Message> {
    return prisma.message.create({ data });
  },

  findById(id: string): Promise<Message | null> {
    return prisma.message.findUnique({ where: { id } });
  },

  async listByConversation({ conversationId, skip, take }: ListParams): Promise<ListResult> {
    const where: Prisma.MessageWhereInput = { conversationId };
    const [items, totalItems] = await Promise.all([
      prisma.message.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.message.count({ where }),
    ]);
    return { items, totalItems };
  },

  delete(id: string): Promise<Message> {
    return prisma.message.delete({ where: { id } });
  },

  count(where?: Prisma.MessageWhereInput): Promise<number> {
    return prisma.message.count({ where });
  },

  async listAll(skip = 0, take = 50) {
    const [items, totalItems] = await Promise.all([
      prisma.message.findMany({ orderBy: { createdAt: "desc" }, skip, take }),
      prisma.message.count(),
    ]);
    return { items, totalItems };
  },

  /** Used for conversations-list unread badges. */
  countUnread(conversationId: string, excludeSenderId: string): Promise<number> {
    return prisma.message.count({
      where: { conversationId, isRead: false, senderId: { not: excludeSenderId } },
    });
  },

  /** Marks every unread message *not sent by* `readerId` as read — i.e. "I've now seen the other person's messages." */
  markConversationRead(conversationId: string, readerId: string): Promise<Prisma.BatchPayload> {
    return prisma.message.updateMany({
      where: { conversationId, isRead: false, senderId: { not: readerId } },
      data: { isRead: true },
    });
  },
};
