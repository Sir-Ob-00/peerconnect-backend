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
  createdBy?: { id: string; firstName: string; lastName: string; profileImage: string | null };
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

  async listForUser(userId: string) {
    return prisma.chatRoom.findMany({ where: { members: { some: { userId } } }, orderBy: { updatedAt: "desc" } });
  },

  findMany() {
    return prisma.chatRoom.findMany({ orderBy: { createdAt: "desc" } });
  },

  update(id: string, data: any) {
    return prisma.chatRoom.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.chatRoom.delete({ where: { id } });
  },

  async findByIdWithCreator(id: string) {
    return prisma.chatRoom.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true, profileImage: true } } },
    });
  },

  count(): Promise<number> {
    return prisma.chatRoom.count();
  },
};
