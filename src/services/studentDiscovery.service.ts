import type { Prisma } from "@prisma/client";
import { studentDiscoveryRepository } from "../repositories/studentDiscovery.repository";
import { studentProfileRepository } from "../repositories/studentProfile.repository";
import { toPublicStudentProfile, type PublicStudentProfile } from "../dtos/studentProfile.dto";
import { toPaginationMeta, toRecommendedStudent, type PaginationMeta, type RecommendedStudent } from "../dtos/studentDiscovery.dto";
import { buildCaseVariants, intersectCaseInsensitive } from "../utils/array.util";
import { DISCOVERY_CONSTANTS } from "../constants/discovery.constants";
import type { SearchStudentsQuery } from "../validators/student.validator";

export interface SearchStudentsResult {
  students: PublicStudentProfile[];
  pagination: PaginationMeta;
}

function parseSkillsFilter(skills: string | undefined): string[] {
  if (!skills) return [];
  return skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const studentDiscoveryService = {
  async searchStudents(query: SearchStudentsQuery): Promise<SearchStudentsResult> {
    const skillsFilter = parseSkillsFilter(query.skills);

    const conditions: Prisma.UserWhereInput[] = [{ deletedAt: null }, { accountStatus: "ACTIVE" }];

    if (query.department) {
      conditions.push({ studentProfile: { is: { department: { contains: query.department, mode: "insensitive" } } } });
    }

    if (skillsFilter.length > 0) {
      conditions.push({ studentProfile: { is: { skills: { hasSome: skillsFilter } } } });
    }

    if (query.search) {
      const termVariants = buildCaseVariants(query.search);
      conditions.push({
        OR: [
          { firstName: { contains: query.search, mode: "insensitive" } },
          { lastName: { contains: query.search, mode: "insensitive" } },
          { studentProfile: { is: { department: { contains: query.search, mode: "insensitive" } } } },
          { studentProfile: { is: { skills: { hasSome: termVariants } } } },
          { studentProfile: { is: { learningInterests: { hasSome: termVariants } } } },
        ],
      });
    }

    const where: Prisma.UserWhereInput = { AND: conditions };
    const skip = (query.page - 1) * query.limit;

    const { items, totalItems } = await studentDiscoveryRepository.search({ where, skip, take: query.limit });

    return {
      students: items.map((user) => toPublicStudentProfile(user, user.studentProfile)),
      pagination: toPaginationMeta(query.page, query.limit, totalItems),
    };
  },

  /**
   * Simple, explainable recommendation logic — deliberately not an ML/AI
   * ranking system: score = number of shared skills + number of shared
   * learning interests, computed by exact (case-insensitive) set
   * intersection. Ties broken by whichever candidate the DB returned first.
   */
  async getRecommendations(userId: string, limit: number): Promise<RecommendedStudent[]> {
    const myProfile = await studentProfileRepository.findByUserId(userId);
    const mySkills = myProfile?.skills ?? [];
    const myInterests = myProfile?.learningInterests ?? [];

    if (mySkills.length === 0 && myInterests.length === 0) {
      // Nothing to base a recommendation on yet — not an error, just an empty result.
      return [];
    }

    const candidates = await studentDiscoveryRepository.findCandidatesBySharedTags(
      userId,
      mySkills,
      myInterests,
      DISCOVERY_CONSTANTS.RECOMMENDATION_CANDIDATE_POOL_SIZE
    );

    const scored = candidates
      .map((candidate) => {
        const candidateSkills = candidate.studentProfile?.skills ?? [];
        const candidateInterests = candidate.studentProfile?.learningInterests ?? [];
        const sharedSkills = intersectCaseInsensitive(mySkills, candidateSkills);
        const sharedLearningInterests = intersectCaseInsensitive(myInterests, candidateInterests);
        return {
          candidate,
          sharedSkills,
          sharedLearningInterests,
          score: sharedSkills.length + sharedLearningInterests.length,
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map(({ candidate, sharedSkills, sharedLearningInterests, score }) =>
      toRecommendedStudent(candidate, candidate.studentProfile, sharedSkills, sharedLearningInterests, score)
    );
  },
};
