import type { Conversation, Message, User } from "@prisma/client";
import { prisma } from "../config/database";

const participantSelect = {
  id: true,
  firstName: true,
  lastName: true,
  profileImage: true,
} as const;

type Participant = Pick<User, "id" | "firstName" | "lastName" | "profileImage">;

export interface ConversationWithParticipants extends Conversation {
  userOne: Participant;
  userTwo: Participant;
}

export interface ConversationWithLastMessage extends ConversationWithParticipants {
  messages: Message[]; // always length 0 or 1 here — see `include` below
}

/** Always stores the pair in a canonical order so the same two users can never get two rows. */
function canonicalPair(userAId: string, userBId: string): { userOneId: string; userTwoId: string } {
  return userAId < userBId ? { userOneId: userAId, userTwoId: userBId } : { userOneId: userBId, userTwoId: userAId };
}

export const conversationRepository = {
  canonicalPair,

  findBetweenUsers(userAId: string, userBId: string): Promise<ConversationWithParticipants | null> {
    const { userOneId, userTwoId } = canonicalPair(userAId, userBId);
    return prisma.conversation.findUnique({
      where: { userOneId_userTwoId: { userOneId, userTwoId } },
      include: { userOne: { select: participantSelect }, userTwo: { select: participantSelect } },
    });
  },

  create(userAId: string, userBId: string): Promise<ConversationWithParticipants> {
    const { userOneId, userTwoId } = canonicalPair(userAId, userBId);
    return prisma.conversation.create({
      data: { userOneId, userTwoId },
      include: { userOne: { select: participantSelect }, userTwo: { select: participantSelect } },
    });
  },

  findById(id: string): Promise<ConversationWithParticipants | null> {
    return prisma.conversation.findUnique({
      where: { id },
      include: { userOne: { select: participantSelect }, userTwo: { select: participantSelect } },
    });
  },

  /** All conversations a user is part of, each with its single most recent message (for a conversations-list preview). */
  listForUser(userId: string): Promise<ConversationWithLastMessage[]> {
    return prisma.conversation.findMany({
      where: { OR: [{ userOneId: userId }, { userTwoId: userId }] },
      include: {
        userOne: { select: participantSelect },
        userTwo: { select: participantSelect },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  listAll(skip = 0, take = 50): Promise<ConversationWithParticipants[]> {
    return prisma.conversation.findMany({
      skip,
      take,
      include: { userOne: { select: participantSelect }, userTwo: { select: participantSelect } },
      orderBy: { createdAt: "desc" },
    });
  },

  count(): Promise<number> {
    return prisma.conversation.count();
  },
};
