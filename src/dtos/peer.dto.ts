import type { StudentProfile, User } from "@prisma/client";
import { toPublicStudentProfile } from "./studentProfile.dto";

export type ConnectionStatus = "none" | "pending_sent" | "pending_received" | "connected" | "blocked";

export interface PeerCard {
  id: string;
  fullName: string;
  profileImage: string | null;
  university: string | null;
  department: string | null;
  programme: string | null;
  level: string | null;
  connectionStatus: ConnectionStatus;
  connectionId?: string | null;
  matchReasons?: string[];
  sharedSkills?: string[];
  sharedLearningInterests?: string[];
  score?: number;
  mutualConnectionsCount?: number;
  sharedGroupsCount?: number;
}

export interface PublicPeerProfile extends PeerCard {
  bio: string | null;
  availability: string | null;
  isAvailable: boolean;
  skills: string[];
  learningInterests: string[];
  connectionsCount: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

export interface ConnectionView {
  id: string;
  requesterId: string;
  receiverId: string;
  status: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
  otherUser: {
    id: string;
    fullName: string;
    profileImage: string | null;
    university: string | null;
    department: string | null;
    programme: string | null;
    level: string | null;
  };
}

export function toPeerCard(
  user: User,
  profile: StudentProfile | null,
  extra: {
    connectionStatus: ConnectionStatus;
    connectionId?: string | null;
    matchReasons?: string[];
    score?: number;
    sharedSkills?: string[];
    sharedLearningInterests?: string[];
    mutualConnectionsCount?: number;
    sharedGroupsCount?: number;
  }
): PeerCard {
  return {
    id: user.id,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    profileImage: profile?.profilePhoto ?? user.profileImage ?? null,
    university: profile?.university ?? null,
    department: profile?.department ?? null,
    programme: profile?.programme ?? null,
    level: profile?.level ?? null,
    connectionStatus: extra.connectionStatus,
    connectionId: extra.connectionId,
    matchReasons: extra.matchReasons,
    score: extra.score,
    sharedSkills: extra.sharedSkills,
    sharedLearningInterests: extra.sharedLearningInterests,
    mutualConnectionsCount: extra.mutualConnectionsCount,
    sharedGroupsCount: extra.sharedGroupsCount,
  };
}

export function toPublicPeerProfile(
  user: User,
  profile: StudentProfile | null,
  extra: {
    connectionStatus: ConnectionStatus;
    connectionId?: string | null;
    mutualConnectionsCount: number;
    sharedGroupsCount: number;
    connectionsCount: number;
  }
): PublicPeerProfile {
  return {
    ...toPeerCard(user, profile, {
      connectionStatus: extra.connectionStatus,
      connectionId: extra.connectionId,
      mutualConnectionsCount: extra.mutualConnectionsCount,
      sharedGroupsCount: extra.sharedGroupsCount,
    }),
    ...toPublicStudentProfile(user, profile),
    connectionsCount: extra.connectionsCount,
  };
}


