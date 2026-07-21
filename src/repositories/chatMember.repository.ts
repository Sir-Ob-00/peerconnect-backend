import { prisma } from "../config/database";
import type { ChatMember } from "@prisma/client";

export const chatMemberRepository = {
  addMember(chatRoomId: string, userId: string, role: "ADMIN" | "MEMBER" = "MEMBER") {
    return prisma.chatMember.create({ data: { chatRoomId, userId, role } });
  },

  removeMember(chatRoomId: string, userId: string) {
    return prisma.chatMember.deleteMany({ where: { chatRoomId, userId } });
  },

  findMember(chatRoomId: string, userId: string): Promise<ChatMember | null> {
    return prisma.chatMember.findUnique({ where: { chatRoomId_userId: { chatRoomId, userId } } as any });
  },

  listMembers(chatRoomId: string): Promise<ChatMember[]> {
    return prisma.chatMember.findMany({ where: { chatRoomId }, include: { user: { select: { id: true, firstName: true, lastName: true, profileImage: true } } } as any });
  },

  countAdmins(chatRoomId: string): Promise<number> {
    return prisma.chatMember.count({ where: { chatRoomId, role: "ADMIN" } });
  },
};
