import type { Prisma, StudentProfile, User } from "@prisma/client";
import { prisma } from "../config/database";

export interface StudentWithProfile extends User {
  studentProfile: StudentProfile | null;
}

interface SearchParams {
  where: Prisma.UserWhereInput;
  skip: number;
  take: number;
}

interface SearchResult {
  items: StudentWithProfile[];
  totalItems: number;
}

export const studentDiscoveryRepository = {
  /** Single indexed query + a matching count — no in-memory filtering of a full table scan. */
  async search({ where, skip, take }: SearchParams): Promise<SearchResult> {
    const [items, totalItems] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { studentProfile: true },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);
    return { items, totalItems };
  },

  /**
   * Coarse DB-side pre-filter for recommendations: any active student
   * (other than the caller) who shares *at least one* skill or learning
   * interest, bounded to `poolSize` rows. Precise overlap scoring happens
   * in the service, only on this already-narrowed candidate set — so the
   * expensive part (ranking) never runs against the whole student table.
   */
  findCandidatesBySharedTags(
    excludeUserId: string,
    skills: string[],
    learningInterests: string[],
    poolSize: number
  ): Promise<StudentWithProfile[]> {
    const orConditions: Prisma.StudentProfileWhereInput[] = [];
    if (skills.length > 0) orConditions.push({ skills: { hasSome: skills } });
    if (learningInterests.length > 0) orConditions.push({ learningInterests: { hasSome: learningInterests } });

    // Caller already guarantees at least one of skills/learningInterests is
    // non-empty before calling this, but guard anyway rather than issuing a
    // query with an empty OR (which would match nothing, silently).
    if (orConditions.length === 0) {
      return Promise.resolve([]);
    }

    return prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        deletedAt: null,
        accountStatus: "ACTIVE",
        studentProfile: { is: { OR: orConditions } },
      },
      include: { studentProfile: true },
      take: poolSize,
    });
  },
};
