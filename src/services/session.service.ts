import { sessionRepository } from "../repositories/session.repository";
import { userRepository } from "../repositories/user.repository";
import { studentProfileRepository } from "../repositories/studentProfile.repository";
import { notificationService } from "./notification.service";
import { emailService } from "./email.service";
import { toPaginationMeta, type PaginationMeta } from "../dtos/studentDiscovery.dto";
import { toSessionView, type SessionView } from "../dtos/session.dto";
import { ApiError } from "../utils/ApiError";
import type { CreateSessionInput } from "../validators/session.validator";
import type { Session } from "@prisma/client";

export interface SessionListResult {
  sessions: SessionView[];
  pagination: PaginationMeta;
}

/** Loads a session or throws 404 — shared by every accept/reject/cancel/complete action below. */
async function getSessionOrThrow(sessionId: string) {
  const session = await sessionRepository.findById(sessionId);
  if (!session) {
    throw ApiError.notFound("Session not found.");
  }
  return session;
}

function assertParticipant(session: Session, userId: string): void {
  if (session.requesterId !== userId && session.receiverId !== userId) {
    throw ApiError.forbidden("You are not a participant in this session.");
  }
}

export const sessionService = {
  async requestSession(requesterId: string, input: CreateSessionInput): Promise<SessionView> {
    if (input.receiverId === requesterId) {
      throw ApiError.badRequest("You cannot request a session with yourself.");
    }

    const receiver = await userRepository.findActiveById(input.receiverId);
    if (!receiver) {
      throw ApiError.notFound("The student you're requesting a session with was not found.");
    }

    const created = await sessionRepository.create({
      requesterId,
      receiverId: input.receiverId,
      skill: input.skill,
      message: input.message,
      scheduledDate: input.scheduledDate,
    });

    const requesterName = `${created.requester.firstName} ${created.requester.lastName}`;
    const receiverName = `${created.receiver.firstName} ${created.receiver.lastName}`;

    // Notification (in-app + real-time) and email are two separate calls on
    // purpose — see notification.service.ts's `createNotification` doc
    // comment for why email isn't baked into that function.
    await notificationService.createNotification({
      userId: created.receiverId,
      title: "New session request",
      message: `${requesterName} requested a session with you on ${created.skill}.`,
      type: "SESSION_REQUEST",
    });

    await emailService.sendSessionRequestEmail({
      receiverEmail: created.receiver.email,
      receiverName,
      requesterName,
      skill: created.skill,
      scheduledDate: created.scheduledDate,
    });

    return toSessionView(created);
  },

  async listIncomingRequests(userId: string, page: number, limit: number): Promise<SessionListResult> {
    const { items, totalItems } = await sessionRepository.list({
      where: { receiverId: userId, status: "PENDING" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { sessions: items.map(toSessionView), pagination: toPaginationMeta(page, limit, totalItems) };
  },

  /** "Sent" + "received" sessions, every status, most recent first. */
  async listHistory(userId: string, page: number, limit: number): Promise<SessionListResult> {
    const { items, totalItems } = await sessionRepository.list({
      where: { OR: [{ requesterId: userId }, { receiverId: userId }] },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { sessions: items.map(toSessionView), pagination: toPaginationMeta(page, limit, totalItems) };
  },

  async acceptSession(sessionId: string, userId: string): Promise<SessionView> {
    const session = await getSessionOrThrow(sessionId);

    if (session.receiverId !== userId) {
      throw ApiError.forbidden("Only the receiver can accept this session request.");
    }
    if (session.status !== "PENDING") {
      throw ApiError.conflict("This session request is no longer pending.");
    }

    // Availability check (Phase 5 requirement): the receiver — the person
    // accepting — must currently be marked available. A profile that
    // doesn't exist yet defaults to available (matches the schema default
    // and the public-profile DTO default), consistent everywhere.
    const receiverProfile = await studentProfileRepository.findByUserId(userId);
    if (receiverProfile && !receiverProfile.isAvailable) {
      throw ApiError.badRequest(
        "You're currently marked unavailable. Update your availability before accepting session requests."
      );
    }

    const updated = await sessionRepository.updateStatus(sessionId, "ACCEPTED");

    const requesterName = `${updated.requester.firstName} ${updated.requester.lastName}`;
    const receiverName = `${updated.receiver.firstName} ${updated.receiver.lastName}`;

    // Notify the requester — they're the one waiting to hear back; the
    // receiver (who just took this action) doesn't need to be told about it.
    await notificationService.createNotification({
      userId: updated.requesterId,
      title: "Session accepted",
      message: `${receiverName} accepted your session request on ${updated.skill}.`,
      type: "SESSION_ACCEPTED",
    });

    await emailService.sendSessionAcceptedEmail({
      requesterEmail: updated.requester.email,
      requesterName,
      receiverName,
      skill: updated.skill,
      scheduledDate: updated.scheduledDate,
    });

    return toSessionView(updated);
  },

  async rejectSession(sessionId: string, userId: string): Promise<SessionView> {
    const session = await getSessionOrThrow(sessionId);

    if (session.receiverId !== userId) {
      throw ApiError.forbidden("Only the receiver can reject this session request.");
    }
    if (session.status !== "PENDING") {
      throw ApiError.conflict("This session request is no longer pending.");
    }

    const updated = await sessionRepository.updateStatus(sessionId, "REJECTED");
    return toSessionView(updated);
  },

  async cancelSession(sessionId: string, userId: string): Promise<SessionView> {
    const session = await getSessionOrThrow(sessionId);
    assertParticipant(session, userId);

    if (session.status !== "PENDING" && session.status !== "ACCEPTED") {
      throw ApiError.conflict("This session can no longer be cancelled.");
    }

    const updated = await sessionRepository.updateStatus(sessionId, "CANCELLED");
    return toSessionView(updated);
  },

  async completeSession(sessionId: string, userId: string): Promise<SessionView> {
    const session = await getSessionOrThrow(sessionId);
    assertParticipant(session, userId);

    if (session.status !== "ACCEPTED") {
      throw ApiError.conflict("Only an accepted session can be marked complete.");
    }

    const updated = await sessionRepository.updateStatus(sessionId, "COMPLETED");
    return toSessionView(updated);
  },
};
