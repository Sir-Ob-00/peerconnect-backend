import { prisma } from "../config/database";

export interface ChatRoomWithMembers {
  id: string;
  type?: string;
  name?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  members: Array<{
    id: string;
    role: string;
    joinedAt: Date;
    chatRoomId: string;
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      profileImage: string | null;
    };
  }>;
}

export const chatRoomRepository = {
  create(data: { type?: string; name?: string | null; description?: string | null; imageUrl?: string | null; createdById: string }) {
    return prisma.chatRoom.create({ data } as any);
  },

  findById(id: string) {
    return prisma.chatRoom.findUnique({ where: { id } });
  },

  findByIdWithMembers(id: string) {
    return prisma.chatRoom.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, profileImage: true },
            },
          },
        },
      },
    }) as Promise<ChatRoomWithMembers | null>;
  },

  listForUser(userId: string) {
    return prisma.chatRoom.findMany({ where: { members: { some: { userId } } }, orderBy: { updatedAt: "desc" } });
  },

  update(id: string, data: any) {
    return prisma.chatRoom.update({ where: { id }, data });
  },
};
