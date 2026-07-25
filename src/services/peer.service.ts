import { peerRepository } from "../repositories/peer.repository";
import { studentProfileRepository } from "../repositories/studentProfile.repository";
import { notificationService } from "../services/notification.service";
import { toPeerCard, toPublicPeerProfile, type PeerCard, type ConnectionView, type PublicPeerProfile, type ConnectionStatus } from "../dtos/peer.dto";
import { intersectCaseInsensitive } from "../utils/array.util";
import { ApiError } from "../utils/ApiError";
import { DISCOVERY_CONSTANTS } from "../constants/discovery.constants";
import type { PeerWithProfile } from "../repositories/peer.repository";
import type { NotificationType } from "@prisma/client";

export const peerService = {
  async getRecommendedPeers(
    currentUserId: string,
    page: number,
    limit: number
  ): Promise<{ data: PeerCard[]; pagination: { page: number; limit: number; totalPages: number; totalItems: number } }> {
    const myProfile = await studentProfileRepository.findByUserId(currentUserId);
    if (!myProfile) {
      return { data: [], pagination: { page, limit, totalPages: 1, totalItems: 0 } };
    }

    const mySkills = myProfile.skills ?? [];
    const myInterests = myProfile.learningInterests ?? [];

    const candidates = await peerRepository.findRecommendationCandidates(
      currentUserId,
      DISCOVERY_CONSTANTS.RECOMMENDATION_CANDIDATE_POOL_SIZE
    );

    const scored = candidates
      .map((candidate) => {
        const profile = candidate.studentProfile;
        if (!profile) return null;

        let score = 0;
        const reasons: string[] = [];

        if (myProfile.universityId && profile.universityId && myProfile.universityId === profile.universityId) {
          score += 30;
          reasons.push("Same university");
        }
        if (myProfile.programmeId && profile.programmeId && myProfile.programmeId === profile.programmeId) {
          score += 25;
          reasons.push("Same programme");
        }
        if (myProfile.departmentId && profile.departmentId && myProfile.departmentId === profile.departmentId) {
          score += 20;
          reasons.push("Same department");
        }
        if (myProfile.levelId && profile.levelId && myProfile.levelId === profile.levelId) {
          score += 10;
          reasons.push("Same level");
        }

        const sharedSkills = intersectCaseInsensitive(mySkills, profile.skills ?? []);
        if (sharedSkills.length > 0) {
          score += 10;
          reasons.push("Shared skills");
        }

        const sharedInterests = intersectCaseInsensitive(myInterests, profile.learningInterests ?? []);
        if (sharedInterests.length > 0) {
          score += 10;
          reasons.push("Shared interests");
        }

        return { candidate: candidate as PeerWithProfile, score, reasons, sharedSkills, sharedInterests };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null && entry.score > 0)
      .sort((a, b) => b.score - a.score || a.candidate.firstName.localeCompare(b.candidate.firstName));

    const totalItems = scored.length;
    const paginated = scored.slice((page - 1) * limit, page * limit);

    const enriched = await Promise.all(
      paginated.map(({ candidate, score, reasons, sharedSkills, sharedInterests }) =>
        enrichPeer(currentUserId, candidate, reasons, score, sharedSkills, sharedInterests)
      )
    );

    return {
      data: enriched,
      pagination: {
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
        totalItems,
      },
    };
  },

  async searchPeers(
    currentUserId: string,
    query: {
      search?: string;
      universityId?: string;
      departmentId?: string;
      programmeId?: string;
      levelId?: string;
      page: number;
      limit: number;
    }
  ): Promise<{ data: PeerCard[]; pagination: { page: number; limit: number; totalPages: number; totalItems: number } }> {
    const result = await peerRepository.search({
      search: query.search,
      universityId: query.universityId,
      departmentId: query.departmentId,
      programmeId: query.programmeId,
      levelId: query.levelId,
      excludeUserId: currentUserId,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    const enriched = await Promise.all(
      result.items.map((peer) => enrichPeer(currentUserId, peer))
    );

    return {
      data: enriched,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(result.totalItems / query.limit)),
        totalItems: result.totalItems,
      },
    };
  },

  async getPeerProfile(
    currentUserId: string,
    peerId: string
  ): Promise<PublicPeerProfile | null> {
    const peer = await peerRepository.findUserById(peerId);
    if (!peer || peer.deletedAt !== null || peer.accountStatus !== "ACTIVE") {
      return null;
    }

    const { status: connectionStatus, connectionId } = await computeConnectionStatus(currentUserId, peerId);
    const [mutualConnectionsCount, sharedGroupsCount, connectionCount] = await Promise.all([
      peerRepository.findMutualConnections(currentUserId, peerId),
      peerRepository.findSharedGroups(currentUserId, peerId),
      peerRepository.findAcceptedConnections(peerId),
    ]);

    return toPublicPeerProfile(peer, peer.studentProfile, {
      connectionStatus,
      connectionId,
      mutualConnectionsCount,
      sharedGroupsCount,
      connectionsCount: connectionCount.length,
    });
  },

  async listConnections(currentUserId: string): Promise<ConnectionView[]> {
    const connections = await peerRepository.findAcceptedConnections(currentUserId);
    const usersMap = await peerRepository.findByIds([currentUserId, ...connections]);

    return connections.map((peerId) => {
      const other = usersMap.get(peerId);
      if (!other) return null;
      return {
        id: `conn-${peerId}`,
        requesterId: currentUserId,
        receiverId: peerId,
        status: "connected" as any,
        createdAt: other.createdAt.toISOString(),
        updatedAt: other.updatedAt.toISOString(),
        otherUser: {
          id: other.id,
          fullName: `${other.firstName} ${other.lastName}`.trim(),
          profileImage: other.profileImage || other.studentProfile?.profilePhoto || null,
          university: other.studentProfile?.university ?? null,
          department: other.studentProfile?.department ?? null,
          programme: other.studentProfile?.programme ?? null,
          level: other.studentProfile?.level ?? null,
        },
      };
    }).filter(Boolean) as ConnectionView[];
  },

  async requestConnection(currentUserId: string, receiverId: string): Promise<ConnectionView> {
    if (currentUserId === receiverId) {
      throw ApiError.badRequest("Cannot send a connection request to yourself.");
    }

    const receiver = await peerRepository.findUserById(receiverId);
    if (!receiver || receiver.deletedAt !== null || receiver.accountStatus !== "ACTIVE") {
      throw ApiError.notFound("User not found or not eligible.");
    }

    const existing = await peerRepository.findConnectionBetween(currentUserId, receiverId);
    if (existing) {
      if (existing.status === "ACCEPTED") {
        throw ApiError.conflict("You are already connected.");
      }
      if (existing.status === "PENDING") {
        if (existing.requesterId === currentUserId) {
          throw ApiError.conflict("Connection request already sent.");
        }
        throw ApiError.conflict("This user has already sent you a connection request.");
      }
    }

    const isBlocked = await peerRepository.isBlocked(currentUserId, receiverId);
    if (isBlocked) {
      throw ApiError.badRequest("Cannot send a connection request to this user.");
    }

    const connection = await peerRepository.createConnection(currentUserId, receiverId);

    const sender = await peerRepository.findUserById(currentUserId);
    const senderName = sender ? `${sender.firstName} ${sender.lastName}`.trim() : "Someone";

    notificationService.createNotification({
      userId: receiverId,
      senderId: currentUserId,
      title: "New connection request",
      message: `${senderName} sent you a connection request.`,
      type: "CONNECTION_REQUEST" as NotificationType,
      entityId: connection.id,
      entityType: "CONNECTION",
    });

    return {
      id: connection.id,
      requesterId: connection.requesterId,
      receiverId: connection.receiverId,
      status: connection.status as any,
      createdAt: connection.createdAt.toISOString(),
      updatedAt: connection.updatedAt.toISOString(),
      otherUser: {
        id: receiverId,
        fullName: `${receiver.firstName} ${receiver.lastName}`.trim(),
        profileImage: receiver.profileImage || receiver.studentProfile?.profilePhoto || null,
        university: receiver.studentProfile?.university ?? null,
        department: receiver.studentProfile?.department ?? null,
        programme: receiver.studentProfile?.programme ?? null,
        level: receiver.studentProfile?.level ?? null,
      },
    };
  },

  async acceptConnection(
    currentUserId: string,
    connectionId: string
  ): Promise<ConnectionView> {
    const existing = await peerRepository.findConnectionById(connectionId);
    if (!existing) throw ApiError.notFound("Connection not found.");
    if (existing.receiverId !== currentUserId) {
      throw ApiError.forbidden("You are not authorized to accept this request.");
    }
    if (existing.status !== "PENDING") {
      throw ApiError.badRequest("This connection request is no longer pending.");
    }

    const updated = await peerRepository.acceptConnection(connectionId);
    const other = existing.requesterId === currentUserId ? existing.receiver : existing.requester;

    if (existing.requesterId !== currentUserId) {
      const accepterName = `${other.firstName} ${other.lastName}`.trim();
      notificationService.createNotification({
        userId: existing.requesterId,
        senderId: currentUserId,
        title: "Connection request accepted",
        message: `${accepterName} accepted your connection request.`,
        type: "CONNECTION_ACCEPTED" as NotificationType,
        entityId: connectionId,
        entityType: "CONNECTION",
      });
    }

    return {
      id: updated.id,
      requesterId: updated.requesterId,
      receiverId: updated.receiverId,
      status: updated.status as any,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      otherUser: {
        id: other.id,
        fullName: `${other.firstName} ${other.lastName}`.trim(),
        profileImage: other.profileImage || other.studentProfile?.profilePhoto || null,
        university: other.studentProfile?.university ?? null,
        department: other.studentProfile?.department ?? null,
        programme: other.studentProfile?.programme ?? null,
        level: other.studentProfile?.level ?? null,
      },
    };
  },

  async rejectConnection(
    currentUserId: string,
    connectionId: string
  ): Promise<ConnectionView> {
    const existing = await peerRepository.findConnectionById(connectionId);
    if (!existing) throw ApiError.notFound("Connection not found.");
    if (existing.receiverId !== currentUserId) {
      throw ApiError.forbidden("You are not authorized to reject this request.");
    }
    if (existing.status !== "PENDING") {
      throw ApiError.badRequest("This connection request is no longer pending.");
    }

    const updated = await peerRepository.rejectConnection(connectionId);
    const other = existing.requesterId === currentUserId ? existing.receiver : existing.requester;

    if (existing.requesterId !== currentUserId) {
      notificationService.createNotification({
        userId: existing.requesterId,
        senderId: currentUserId,
        title: "Connection request declined",
        message: "Your connection request was declined.",
        type: "CONNECTION_REJECTED" as NotificationType,
        entityId: connectionId,
        entityType: "CONNECTION",
      });
    }

    return {
      id: updated.id,
      requesterId: updated.requesterId,
      receiverId: updated.receiverId,
      status: updated.status as any,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      otherUser: {
        id: other.id,
        fullName: `${other.firstName} ${other.lastName}`.trim(),
        profileImage: other.profileImage || other.studentProfile?.profilePhoto || null,
        university: other.studentProfile?.university ?? null,
        department: other.studentProfile?.department ?? null,
        programme: other.studentProfile?.programme ?? null,
        level: other.studentProfile?.level ?? null,
      },
    };
  },

  async removeConnection(currentUserId: string, connectionId: string): Promise<void> {
    const connection = await peerRepository.findConnectionById(connectionId);
    if (!connection) throw ApiError.notFound("Connection not found.");
    if (connection.requesterId !== currentUserId && connection.receiverId !== currentUserId) {
      throw ApiError.forbidden("You are not authorized to remove this connection.");
    }
    await peerRepository.deleteConnection(connectionId);
  },

  async blockUser(currentUserId: string, targetUserId: string, reason?: string): Promise<void> {
    if (currentUserId === targetUserId) {
      throw ApiError.badRequest("You cannot block yourself.");
    }
    const target = await peerRepository.findUserById(targetUserId);
    if (!target || target.deletedAt !== null || target.accountStatus !== "ACTIVE") {
      throw ApiError.notFound("User not found or not eligible.");
    }
    await peerRepository.blockUser(currentUserId, targetUserId, reason);
  },

  async unblockUser(currentUserId: string, targetUserId: string): Promise<void> {
    await peerRepository.unblockUser(currentUserId, targetUserId);
  },
};

async function enrichPeer(
  currentUserId: string,
  peer: PeerWithProfile,
  matchReasons?: string[],
  score?: number,
  sharedSkills?: string[],
  sharedLearningInterests?: string[]
): Promise<PeerCard> {
  const { status: connectionStatus, connectionId } = await computeConnectionStatus(currentUserId, peer.id);
  const [mutualConnectionsCount, sharedGroupsCount] = await Promise.all([
    peerRepository.findMutualConnections(currentUserId, peer.id),
    peerRepository.findSharedGroups(currentUserId, peer.id),
  ]);

  return toPeerCard(peer, peer.studentProfile, {
    connectionStatus,
    connectionId,
    matchReasons,
    score,
    sharedSkills,
    sharedLearningInterests,
    mutualConnectionsCount,
    sharedGroupsCount,
  });
}

async function computeConnectionStatus(
  currentUserId: string,
  peerId: string
): Promise<{ status: ConnectionStatus; connectionId?: string | null }> {
  const existing = await peerRepository.findConnectionBetween(currentUserId, peerId);
  if (!existing) return { status: "none" };

  if (existing.status === "PENDING") {
    if (existing.requesterId === currentUserId) return { status: "pending_sent", connectionId: existing.id };
    return { status: "pending_received", connectionId: existing.id };
  }

  if (existing.status === "ACCEPTED") return { status: "connected", connectionId: existing.id };
  if (existing.status === "REJECTED") return { status: "none" };

  return { status: "none" };
}
