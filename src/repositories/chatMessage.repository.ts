import { prisma } from "../config/database";
import type { ChatMessage } from "@prisma/client";

interface CreateData {
  chatRoomId: string;
  senderId: string;
  content?: string | null;
  messageType?: "TEXT" | "IMAGE" | "FILE";
}

interface ListParams {
  chatRoomId: string;
  skip: number;
  take: number;
}

interface ListResult {
  items: ChatMessage[];
  totalItems: number;
}

export const chatMessageRepository = {
  create(data: CreateData): Promise<ChatMessage> {
    return prisma.chatMessage.create({ data });
  },

  async listByChatRoom({ chatRoomId, skip, take }: ListParams): Promise<ListResult> {
    const where = { chatRoomId };
    const [items, totalItems] = await Promise.all([
      prisma.chatMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.chatMessage.count({ where }),
    ]);
    return { items, totalItems };
  },

  countUnread(chatRoomId: string, excludeSenderId: string): Promise<number> {
    return prisma.chatMessage.count({ where: { chatRoomId, isRead: false, senderId: { not: excludeSenderId } } });
  },

  markRoomRead(chatRoomId: string, readerId: string) {
    return prisma.chatMessage.updateMany({ where: { chatRoomId, isRead: false, senderId: { not: readerId } }, data: { isRead: true } });
  },
};
