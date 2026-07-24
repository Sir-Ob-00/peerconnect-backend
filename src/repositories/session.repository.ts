import type { Prisma, Session, SessionStatus, User } from "@prisma/client";
import { prisma } from "../config/database";

export interface SessionWithParticipants extends Session {
  // `email` is included here because session.service.ts needs it to send
  // notification emails (Phase 8) — but session.dto.ts's toParticipant()
  // deliberately does NOT pass it through to API responses. The repository
  // layer knows more than the public contract exposes; that's fine as long
  // as the DTO stays the one gate everything public goes through.
  requester: Pick<User, "id" | "firstName" | "lastName" | "profileImage" | "email">;
  receiver: Pick<User, "id" | "firstName" | "lastName" | "profileImage" | "email">;
}

const participantSelect = {
  id: true,
  firstName: true,
  lastName: true,
  profileImage: true,
  email: true,
} as const;

interface CreateSessionData {
  requesterId: string;
  receiverId: string;
  skill: string;
  message?: string;
  scheduledDate: Date;
}

interface ListParams {
  where: Prisma.SessionWhereInput;
  skip: number;
  take: number;
}

interface ListResult {
  items: SessionWithParticipants[];
  totalItems: number;
}

export const sessionRepository = {
  create(data: CreateSessionData): Promise<SessionWithParticipants> {
    return prisma.session.create({
      data,
      include: { requester: { select: participantSelect }, receiver: { select: participantSelect } },
    });
  },

  findById(id: string): Promise<SessionWithParticipants | null> {
    return prisma.session.findUnique({
      where: { id },
      include: { requester: { select: participantSelect }, receiver: { select: participantSelect } },
    });
  },

  async list({ where, skip, take }: ListParams): Promise<ListResult> {
    const [items, totalItems] = await Promise.all([
      prisma.session.findMany({
        where,
        include: { requester: { select: participantSelect }, receiver: { select: participantSelect } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.session.count({ where }),
    ]);
    return { items, totalItems };
  },

  updateStatus(id: string, status: SessionStatus): Promise<SessionWithParticipants> {
    return prisma.session.update({
      where: { id },
      data: { status },
      include: { requester: { select: participantSelect }, receiver: { select: participantSelect } },
    });
  },

  async findMany(filters: {
    status?: string;
    requesterId?: string;
    receiverId?: string;
    skill?: string;
    skip?: number;
    take?: number;
  }): Promise<ListResult> {
    const where: Prisma.SessionWhereInput = {};
    if (filters.status) where.status = filters.status as any;
    if (filters.requesterId) where.requesterId = filters.requesterId;
    if (filters.receiverId) where.receiverId = filters.receiverId;
    if (filters.skill) where.skill = { contains: filters.skill, mode: "insensitive" };

    const [items, totalItems] = await Promise.all([
      prisma.session.findMany({
        where,
        include: { requester: { select: participantSelect }, receiver: { select: participantSelect } },
        orderBy: { createdAt: "desc" },
        skip: filters.skip ?? 0,
        take: filters.take ?? 10,
      }),
      prisma.session.count({ where }),
    ]);
    return { items, totalItems };
  },

  count(where?: Prisma.SessionWhereInput): Promise<number> {
    return prisma.session.count({ where });
  },
};
