import type { StudentProfile, User } from "@prisma/client";

export interface StudentProfileView {
  id: string;
  userId: string;
  university: string | null;
  department: string | null;
  programme: string | null;
  level: string | null;
  skills: string[];
  learningInterests: string[];
  bio: string | null;
  availability: string | null;
  isAvailable: boolean;
  profilePhoto: string | null;
  studentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Maps a raw Prisma StudentProfile row to its API shape (currently 1:1, but keeps a seam for later changes). */
export function toStudentProfileView(profile: StudentProfile): StudentProfileView {
  return {
    id: profile.id,
    userId: profile.userId,
    university: profile.university,
    department: profile.department,
    programme: profile.programme,
    level: profile.level,
    skills: profile.skills,
    learningInterests: profile.learningInterests,
    bio: profile.bio,
    availability: profile.availability,
    isAvailable: profile.isAvailable,
    profilePhoto: profile.profilePhoto,
    studentId: profile.studentId ?? null,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export interface PublicStudentProfile {
  userId: string;
  firstName: string;
  lastName: string;
  university: string | null;
  department: string | null;
  programme: string | null;
  level: string | null;
  skills: string[];
  learningInterests: string[];
  bio: string | null;
  availability: string | null;
  isAvailable: boolean;
  profilePhoto: string | null;
}

/**
 * Public view for GET /profile/:id — combines the User's basic display name
 * with their StudentProfile, deliberately excluding email, role,
 * accountStatus, and isEmailVerified (those stay internal to the account
 * owner via /auth/me, not exposed to other students browsing profiles).
 *
 * `profile` is nullable: a user can exist without ever having filled in a
 * profile yet. Rather than 404-ing (which would look like the *user*
 * doesn't exist) this renders an empty-but-well-formed profile — a fresh
 * profile defaults `isAvailable` to `true` (matching the schema default),
 * since "hasn't set up a profile yet" isn't the same as "unavailable."
 */
export function toPublicStudentProfile(user: User, profile: StudentProfile | null): PublicStudentProfile {
  return {
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    university: profile?.university ?? null,
    department: profile?.department ?? null,
    programme: profile?.programme ?? null,
    level: profile?.level ?? null,
    skills: profile?.skills ?? [],
    learningInterests: profile?.learningInterests ?? [],
    bio: profile?.bio ?? null,
    availability: profile?.availability ?? null,
    isAvailable: profile?.isAvailable ?? true,
    profilePhoto: profile?.profilePhoto ?? null,
  };
}
