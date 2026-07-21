import type { User } from "@prisma/client";

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: User["role"];
  accountStatus: User["accountStatus"];
  profileImage: string | null;
  isEmailVerified: boolean;
  studentVerified: boolean;
  verificationStatus: string;
  setupProgress: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Strips `password` (and any other internal-only fields) before a User ever reaches a response body. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    profileImage: user.profileImage,
    isEmailVerified: user.isEmailVerified,
    studentVerified: (user as any).studentVerified ?? false,
    verificationStatus: (user as any).verificationStatus ?? "unverified",
    setupProgress: (user as any).setupProgress ?? "email",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
