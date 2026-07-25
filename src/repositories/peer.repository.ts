import type { Prisma, StudentProfile, User } from "@prisma/client";
import { prisma } from "../config/database";

export interface PeerWithProfile extends User {
  studentProfile: StudentProfile | null;
}

export interface PeerSearchParams {
  search?: string;
  universityId?: string;
  departmentId?: string;
  programmeId?: string;
  levelId?: string;
  excludeUserId: string;
  skip: number;
  take: number;
}

export interface PeerSearchResult {
  items: PeerWithProfile[];
  totalItems: number;
}

export interface ConnectionPair {
  requesterId: string;
  receiverId: string;
}

export const peerRepository = {
  async search(params: PeerSearchParams): Promise<PeerSearchResult> {
    const conditions: Prisma.UserWhereInput[] = [
      { id: { not: params.excludeUserId } },
      { deletedAt: null },
      { accountStatus: "ACTIVE" },
    ];

    if (params.search) {
      conditions.push({
        OR: [
          { firstName: { contains: params.search, mode: "insensitive" } },
          { lastName: { contains: params.search, mode: "insensitive" } },
        ],
      });
    }

    const profileConditions: Prisma.StudentProfileWhereInput[] = [];
    if (params.universityId) profileConditions.push({ universityId: params.universityId });
    if (params.departmentId) profileConditions.push({ departmentId: params.departmentId });
    if (params.programmeId) profileConditions.push({ programmeId: params.programmeId });
    if (params.levelId) profileConditions.push({ levelId: params.levelId });

    if (profileConditions.length > 0) {
      conditions.push({ studentProfile: { is: { AND: profileConditions } } });
    }

    const where: Prisma.UserWhereInput = { AND: conditions };

    const [items, totalItems] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { studentProfile: true },
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return { items: items as PeerWithProfile[], totalItems };
  },

  async findByIds(userIds: string[]): Promise<Map<string, PeerWithProfile>> {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { studentProfile: true },
    });
    return new Map(users.map((u) => [u.id, u as PeerWithProfile]));
  },

  async findRecommendationCandidates(excludeUserId: string, poolSize: number): Promise<PeerWithProfile[]> {
    return prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        deletedAt: null,
        accountStatus: "ACTIVE",
        studentProfile: { isNot: null },
      },
      include: { studentProfile: true },
      take: poolSize,
    });
  },

  async findUserById(id: string): Promise<PeerWithProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { studentProfile: true },
    });
    return user as PeerWithProfile | null;
  },

  async findConnectionBetween(userIdA: string, userIdB: string) {
    const [a, b] = await Promise.all([
      prisma.connection.findFirst({
        where: { requesterId: userIdA, receiverId: userIdB },
        include: { requester: { include: { studentProfile: true } }, receiver: { include: { studentProfile: true } } },
      }),
      prisma.connection.findFirst({
        where: { requesterId: userIdB, receiverId: userIdA },
        include: { requester: { include: { studentProfile: true } }, receiver: { include: { studentProfile: true } } },
      }),
    ]);
    return a || b || null;
  },

  async findConnectionById(connectionId: string) {
    return prisma.connection.findUnique({
      where: { id: connectionId },
      include: { requester: { include: { studentProfile: true } }, receiver: { include: { studentProfile: true } } },
    });
  },

  async findPendingConnections(userId: string): Promise<
    { id: string; requesterId: string; receiverId: string; status: string }[]
  > {
    return prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: userId, status: "PENDING" },
          { receiverId: userId, status: "PENDING" },
        ],
      },
      select: { id: true, requesterId: true, receiverId: true, status: true },
    });
  },

  async findAcceptedConnections(userId: string): Promise<string[]> {
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: userId, status: "ACCEPTED" },
          { receiverId: userId, status: "ACCEPTED" },
        ],
      },
      select: { requesterId: true, receiverId: true },
    });
    return connections.map((c) => (c.requesterId === userId ? c.receiverId : c.requesterId));
  },

  async findBlockedUsers(userId: string): Promise<string[]> {
    const blocks = await prisma.blockedUser.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    });
    return blocks.map((b) => b.blockedId);
  },

  async createConnection(requesterId: string, receiverId: string) {
    return prisma.connection.create({
      data: { requesterId, receiverId, status: "PENDING" },
      include: { requester: true, receiver: true },
    });
  },

  async acceptConnection(connectionId: string) {
    return prisma.connection.update({
      where: { id: connectionId },
      data: { status: "ACCEPTED" },
      include: { requester: true, receiver: true },
    });
  },

  async rejectConnection(connectionId: string) {
    return prisma.connection.update({
      where: { id: connectionId },
      data: { status: "REJECTED" },
      include: { requester: true, receiver: true },
    });
  },

  async deleteConnection(connectionId: string) {
    return prisma.connection.delete({ where: { id: connectionId } });
  },

  async blockUser(blockerId: string, blockedId: string, reason?: string) {
    return prisma.blockedUser.create({
      data: { blockerId, blockedId, reason: reason || null },
    });
  },

  async unblockUser(blockerId: string, blockedId: string) {
    return prisma.blockedUser.delete({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
  },

  async isBlocked(userIdA: string, userIdB: string): Promise<boolean> {
    const count = await prisma.blockedUser.count({
      where: {
        OR: [
          { blockerId: userIdA, blockedId: userIdB },
          { blockerId: userIdB, blockedId: userIdA },
        ],
      },
    });
    return count > 0;
  },

  async findSharedGroups(userIdA: string, userIdB: string): Promise<number> {
    const count = await prisma.chatMember.count({
      where: {
        userId: userIdA,
        chatRoom: {
          members: {
            some: { userId: userIdB },
          },
        },
      },
    });
    return count;
  },

  async findMutualConnections(userIdA: string, userIdB: string): Promise<number> {
    const connectionsA = await prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: userIdA, status: "ACCEPTED" },
          { receiverId: userIdA, status: "ACCEPTED" },
        ],
      },
      select: {
        requesterId: true,
        receiverId: true,
      },
    });

    const setA = new Set(
      connectionsA.map((c) => (c.requesterId === userIdA ? c.receiverId : c.requesterId))
    );

    const connectionsB = await prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: userIdB, status: "ACCEPTED" },
          { receiverId: userIdB, status: "ACCEPTED" },
        ],
      },
      select: {
        requesterId: true,
        receiverId: true,
      },
    });

    let mutual = 0;
    for (const c of connectionsB) {
      const otherId = c.requesterId === userIdB ? c.receiverId : c.requesterId;
      if (setA.has(otherId)) mutual++;
    }
    return mutual;
  },
};
