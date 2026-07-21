import { prisma } from "../config/database";
import type { ChatRoom, ChatMember, User } from "@prisma/client";

const memberSelect = {
  id: true,
  role: true,
  joinedAt: true,
  user: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
} as const;

export interface ChatRoomWithMembers extends ChatRoom {
  members: (ChatMember & { user: Pick<User, "id" | "firstName" | "lastName" | "profileImage"> })[];
}

export const chatRoomRepository = {
  create(data: { type?: string; name?: string | null; description?: string | null; imageUrl?: string | null; createdById: string }) {
    return prisma.chatRoom.create({ data });
  },

  findById(id: string): Promise<ChatRoom | null> {
    return prisma.chatRoom.findUnique({ where: { id } });
  },

  findByIdWithMembers(id: string): Promise<ChatRoomWithMembers | null> {
    return prisma.chatRoom.findUnique({ where: { id }, include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true, profileImage: true } }, select: { id: true, role: true, joinedAt: true } } } } as any });
  },

  listForUser(userId: string): Promise<ChatRoom[]> {
    return prisma.chatRoom.findMany({ where: { members: { some: { userId } } }, orderBy: { updatedAt: "desc" } });
  },

  update(id: string, data: Partial<ChatRoom>) {
    return prisma.chatRoom.update({ where: { id }, data });
  },
};
