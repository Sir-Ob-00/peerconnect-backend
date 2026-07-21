import type { User } from "@prisma/client";
import type { SessionWithParticipants } from "../repositories/session.repository";

export interface SessionParticipant {
  id: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

export interface SessionView {
  id: string;
  skill: string;
  message: string | null;
  status: string;
  scheduledDate: Date;
  requester: SessionParticipant;
  receiver: SessionParticipant;
  createdAt: Date;
  updatedAt: Date;
}

function toParticipant(user: Pick<User, "id" | "firstName" | "lastName" | "profileImage">): SessionParticipant {
  return { id: user.id, firstName: user.firstName, lastName: user.lastName, profileImage: user.profileImage };
}

export function toSessionView(session: SessionWithParticipants): SessionView {
  return {
    id: session.id,
    skill: session.skill,
    message: session.message,
    status: session.status,
    scheduledDate: session.scheduledDate,
    requester: toParticipant(session.requester),
    receiver: toParticipant(session.receiver),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}
