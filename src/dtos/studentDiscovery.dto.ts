import type { StudentProfile, User } from "@prisma/client";
import { toPublicStudentProfile, type PublicStudentProfile } from "./studentProfile.dto";

export interface PaginationMeta {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

export function toPaginationMeta(page: number, limit: number, totalItems: number): PaginationMeta {
  return {
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    totalItems,
  };
}

export interface RecommendedStudent extends PublicStudentProfile {
  sharedSkills: string[];
  sharedLearningInterests: string[];
  score: number;
}

export function toRecommendedStudent(
  user: User,
  profile: StudentProfile | null,
  sharedSkills: string[],
  sharedLearningInterests: string[],
  score: number
): RecommendedStudent {
  return {
    ...toPublicStudentProfile(user, profile),
    sharedSkills,
    sharedLearningInterests,
    score,
  };
}
