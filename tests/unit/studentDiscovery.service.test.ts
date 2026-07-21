jest.mock("../../src/repositories/studentDiscovery.repository", () => ({
  studentDiscoveryRepository: {
    search: jest.fn(),
    findCandidatesBySharedTags: jest.fn(),
  },
}));

jest.mock("../../src/repositories/studentProfile.repository", () => ({
  studentProfileRepository: {
    findByUserId: jest.fn(),
  },
}));

import { studentDiscoveryService } from "../../src/services/studentDiscovery.service";
import { studentDiscoveryRepository } from "../../src/repositories/studentDiscovery.repository";
import { studentProfileRepository } from "../../src/repositories/studentProfile.repository";

const mockDiscoveryRepo = studentDiscoveryRepository as jest.Mocked<typeof studentDiscoveryRepository>;
const mockProfileRepo = studentProfileRepository as jest.Mocked<typeof studentProfileRepository>;

const ME_ID = "11111111-1111-1111-1111-111111111111";

function makeUser(id: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id,
    firstName: "Ama",
    lastName: "Mensah",
    email: `${id}@st.university.edu.gh`,
    password: "hashed",
    role: "STUDENT",
    accountStatus: "ACTIVE",
    profileImage: null,
    isEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    studentProfile: null,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "profile-1",
    userId: ME_ID,
    department: null,
    level: null,
    skills: [],
    learningInterests: [],
    bio: null,
    availability: null,
    profilePhoto: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("studentDiscoveryService.searchStudents", () => {
  it("computes correct skip/pagination math and maps results", async () => {
    const student = makeUser("student-1", {
      studentProfile: makeProfile({ userId: "student-1", department: "Computer Science", skills: ["React"] }),
    });
    mockDiscoveryRepo.search.mockResolvedValue({ items: [student] as never, totalItems: 12 });

    const result = await studentDiscoveryService.searchStudents({ page: 2, limit: 5 } as never);

    expect(mockDiscoveryRepo.search).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 })
    );
    expect(result.pagination).toEqual({ page: 2, limit: 5, totalPages: 3, totalItems: 12 });
    expect(result.students).toHaveLength(1);
    expect(result.students[0].department).toBe("Computer Science");
    expect(result.students[0]).not.toHaveProperty("email");
  });

  it("always reports at least 1 total page, even with zero results", async () => {
    mockDiscoveryRepo.search.mockResolvedValue({ items: [], totalItems: 0 });

    const result = await studentDiscoveryService.searchStudents({ page: 1, limit: 10 } as never);

    expect(result.pagination.totalPages).toBe(1);
    expect(result.students).toEqual([]);
  });

  it("parses a comma-separated skills filter into an array condition", async () => {
    mockDiscoveryRepo.search.mockResolvedValue({ items: [], totalItems: 0 });

    await studentDiscoveryService.searchStudents({ page: 1, limit: 10, skills: "React, Node.js" } as never);

    const callArg = mockDiscoveryRepo.search.mock.calls[0][0];
    const serialized = JSON.stringify(callArg.where);
    expect(serialized).toContain("React");
    expect(serialized).toContain("Node.js");
  });
});

describe("studentDiscoveryService.getRecommendations", () => {
  it("returns an empty list without querying candidates when the caller has no skills or interests", async () => {
    mockProfileRepo.findByUserId.mockResolvedValue(makeProfile({ skills: [], learningInterests: [] }) as never);

    const result = await studentDiscoveryService.getRecommendations(ME_ID, 10);

    expect(result).toEqual([]);
    expect(mockDiscoveryRepo.findCandidatesBySharedTags).not.toHaveBeenCalled();
  });

  it("scores candidates by shared skills + shared learning interests, case-insensitively", async () => {
    mockProfileRepo.findByUserId.mockResolvedValue(
      makeProfile({ skills: ["React", "Node.js"], learningInterests: ["Machine Learning"] }) as never
    );

    const candidateA = makeUser("candidate-a", {
      studentProfile: makeProfile({ userId: "candidate-a", skills: ["react", "MongoDB"], learningInterests: [] }),
    });
    const candidateB = makeUser("candidate-b", {
      studentProfile: makeProfile({
        userId: "candidate-b",
        skills: ["React", "Node.js"],
        learningInterests: ["machine learning"],
      }),
    });
    mockDiscoveryRepo.findCandidatesBySharedTags.mockResolvedValue([candidateA, candidateB] as never);

    const result = await studentDiscoveryService.getRecommendations(ME_ID, 10);

    // candidateB shares 2 skills + 1 interest = score 3; candidateA shares 1 skill = score 1
    expect(result[0].userId).toBe("candidate-b");
    expect(result[0].score).toBe(3);
    expect(result[0].sharedSkills).toEqual(["React", "Node.js"]);
    expect(result[0].sharedLearningInterests).toEqual(["Machine Learning"]);

    expect(result[1].userId).toBe("candidate-a");
    expect(result[1].score).toBe(1);
  });

  it("excludes candidates with zero real overlap and respects the limit", async () => {
    mockProfileRepo.findByUserId.mockResolvedValue(makeProfile({ skills: ["React"] }) as never);

    const zeroOverlap = makeUser("zero", {
      studentProfile: makeProfile({ userId: "zero", skills: ["Python"] }),
    });
    const matchOne = makeUser("match-1", { studentProfile: makeProfile({ userId: "match-1", skills: ["React"] }) });
    const matchTwo = makeUser("match-2", { studentProfile: makeProfile({ userId: "match-2", skills: ["React"] }) });

    mockDiscoveryRepo.findCandidatesBySharedTags.mockResolvedValue([zeroOverlap, matchOne, matchTwo] as never);

    const result = await studentDiscoveryService.getRecommendations(ME_ID, 1);

    expect(result).toHaveLength(1);
    expect(result[0].userId).not.toBe("zero");
  });

  it("passes the candidate pool size and excludes the caller from the query", async () => {
    mockProfileRepo.findByUserId.mockResolvedValue(makeProfile({ skills: ["React"] }) as never);
    mockDiscoveryRepo.findCandidatesBySharedTags.mockResolvedValue([]);

    await studentDiscoveryService.getRecommendations(ME_ID, 10);

    expect(mockDiscoveryRepo.findCandidatesBySharedTags).toHaveBeenCalledWith(
      ME_ID,
      ["React"],
      [],
      expect.any(Number)
    );
  });
});
