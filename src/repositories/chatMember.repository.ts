import { prisma } from "../config/database";

export const chatMemberRepository = {
  addMember(chatRoomId: string, userId: string, role: "ADMIN" | "MEMBER" = "MEMBER") {
    return prisma.chatMember.create({ data: { chatRoomId, userId, role } });
  },

  removeMember(chatRoomId: string, userId: string) {
    return prisma.chatMember.deleteMany({ where: { chatRoomId, userId } });
  },

  findMember(chatRoomId: string, userId: string) {
    return prisma.chatMember.findUnique({ where: { chatRoomId_userId: { chatRoomId, userId } } as any });
  },

  listMembers(chatRoomId: string) {
    return prisma.chatMember.findMany({
      where: { chatRoomId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, profileImage: true },
        },
      },
    } as any);
  },

  countAdmins(chatRoomId: string) {
    return prisma.chatMember.count({ where: { chatRoomId, role: "ADMIN" } });
  },
};
