import request from "supertest";

// All repositories mocked — app.ts mounts every router together, so every
// repository module has to be mocked here regardless of which routes this
// file actually exercises (see README "Testing" for why).
jest.mock("../../src/repositories/user.repository", () => ({
  userRepository: {
    findActiveById: jest.fn(),
  },
}));

jest.mock("../../src/repositories/refreshToken.repository", () => ({
  refreshTokenRepository: {
    create: jest.fn(),
    findById: jest.fn(),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn(),
    deleteExpired: jest.fn(),
  },
}));

jest.mock("../../src/repositories/passwordResetToken.repository", () => ({
  passwordResetTokenRepository: {
    create: jest.fn(),
    findByTokenHash: jest.fn(),
    markUsed: jest.fn(),
    invalidateAllForUser: jest.fn(),
  },
}));

jest.mock("../../src/repositories/studentProfile.repository", () => ({
  studentProfileRepository: {
    findByUserId: jest.fn(),
    getOrCreateByUserId: jest.fn(),
    updateByUserId: jest.fn(),
    setProfilePhoto: jest.fn(),
  },
}));

jest.mock("../../src/repositories/studentDiscovery.repository", () => ({
  studentDiscoveryRepository: {
    search: jest.fn(),
    findCandidatesBySharedTags: jest.fn(),
  },
}));

jest.mock("../../src/repositories/session.repository", () => ({
  sessionRepository: {
    create: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    updateStatus: jest.fn(),
  },
}));

jest.mock("../../src/repositories/conversation.repository", () => ({
  conversationRepository: {
    // Reimplemented inline (rather than jest.requireActual) so the real
    // module — which imports config/database and constructs a PrismaClient
    // at import time — never loads at all, even just to grab this one pure
    // helper function.
    canonicalPair: (a: string, b: string) => (a < b ? { userOneId: a, userTwoId: b } : { userOneId: b, userTwoId: a }),
    findBetweenUsers: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    listForUser: jest.fn(),
  },
}));

jest.mock("../../src/repositories/message.repository", () => ({
  messageRepository: {
    create: jest.fn(),
    listByConversation: jest.fn(),
    countUnread: jest.fn(),
    markConversationRead: jest.fn(),
  },
}));

jest.mock("../../src/repositories/review.repository", () => ({
  reviewRepository: {
    create: jest.fn(),
    findBySessionId: jest.fn(),
    listByReceiver: jest.fn(),
    getRatingSummary: jest.fn(),
  },
}));

jest.mock("../../src/repositories/notification.repository", () => ({
  notificationRepository: {
    create: jest.fn(),
    findById: jest.fn(),
    listByUser: jest.fn(),
    countUnread: jest.fn(),
    markRead: jest.fn(),
  },
}));


import { createApp } from "../../src/app";
import { studentProfileRepository } from "../../src/repositories/studentProfile.repository";
import { studentDiscoveryRepository } from "../../src/repositories/studentDiscovery.repository";
import { signAccessToken } from "../../src/utils/jwt.util";

const mockProfileRepo = studentProfileRepository as jest.Mocked<typeof studentProfileRepository>;
const mockDiscoveryRepo = studentDiscoveryRepository as jest.Mocked<typeof studentDiscoveryRepository>;

const app = createApp();
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

function tokenFor(userId: string) {
  return signAccessToken({ userId, role: "STUDENT" as never });
}

describe("GET /api/v1/students", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/v1/students");
    expect(res.status).toBe(401);
  });

  it("returns a paginated {data, pagination} shape nested under the envelope's data key", async () => {
    const student = makeUser("student-1", {
      studentProfile: makeProfile({ userId: "student-1", department: "Computer Science", skills: ["React"] }),
    });
    mockDiscoveryRepo.search.mockResolvedValue({ items: [student] as never, totalItems: 1 });

    const res = await request(app).get("/api/v1/students").set("Authorization", `Bearer ${tokenFor(ME_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data).toHaveLength(1);
    expect(res.body.data.data[0].department).toBe("Computer Science");
    expect(res.body.data.pagination).toEqual({ page: 1, limit: 10, totalPages: 1, totalItems: 1 });
  });

  it("applies default pagination when page/limit are omitted", async () => {
    mockDiscoveryRepo.search.mockResolvedValue({ items: [], totalItems: 0 });

    await request(app).get("/api/v1/students").set("Authorization", `Bearer ${tokenFor(ME_ID)}`);

    expect(mockDiscoveryRepo.search).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }));
  });

  it("rejects an out-of-range limit with 422", async () => {
    const res = await request(app)
      .get("/api/v1/students?limit=500")
      .set("Authorization", `Bearer ${tokenFor(ME_ID)}`);
    expect(res.status).toBe(422);
  });

  it("passes search/department/skills query params through", async () => {
    mockDiscoveryRepo.search.mockResolvedValue({ items: [], totalItems: 0 });

    await request(app)
      .get("/api/v1/students?search=React&department=Computer%20Science&skills=React,Node.js")
      .set("Authorization", `Bearer ${tokenFor(ME_ID)}`);

    expect(mockDiscoveryRepo.search).toHaveBeenCalledTimes(1);
    const whereArg = mockDiscoveryRepo.search.mock.calls[0][0].where;
    const serialized = JSON.stringify(whereArg);
    expect(serialized).toContain("Computer Science");
  });
});

describe("GET /api/v1/students/recommendations", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/v1/students/recommendations");
    expect(res.status).toBe(401);
  });

  it("returns an empty array when the caller has no skills/interests yet", async () => {
    mockProfileRepo.findByUserId.mockResolvedValue(makeProfile({ skills: [], learningInterests: [] }) as never);

    const res = await request(app)
      .get("/api/v1/students/recommendations")
      .set("Authorization", `Bearer ${tokenFor(ME_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("returns scored, sorted recommendations", async () => {
    mockProfileRepo.findByUserId.mockResolvedValue(makeProfile({ skills: ["React", "Node.js"] }) as never);
    const strongMatch = makeUser("strong", { studentProfile: makeProfile({ userId: "strong", skills: ["React", "Node.js"] }) });
    const weakMatch = makeUser("weak", { studentProfile: makeProfile({ userId: "weak", skills: ["React"] }) });
    mockDiscoveryRepo.findCandidatesBySharedTags.mockResolvedValue([weakMatch, strongMatch] as never);

    const res = await request(app)
      .get("/api/v1/students/recommendations")
      .set("Authorization", `Bearer ${tokenFor(ME_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].userId).toBe("strong");
    expect(res.body.data[0].score).toBe(2);
  });

  it("respects a custom limit query param", async () => {
    mockProfileRepo.findByUserId.mockResolvedValue(makeProfile({ skills: ["React"] }) as never);
    mockDiscoveryRepo.findCandidatesBySharedTags.mockResolvedValue([]);

    await request(app)
      .get("/api/v1/students/recommendations?limit=25")
      .set("Authorization", `Bearer ${tokenFor(ME_ID)}`);

    expect(mockDiscoveryRepo.findCandidatesBySharedTags).toHaveBeenCalledWith(ME_ID, ["React"], [], expect.any(Number));
  });

  it("rejects a limit above the max with 422", async () => {
    const res = await request(app)
      .get("/api/v1/students/recommendations?limit=1000")
      .set("Authorization", `Bearer ${tokenFor(ME_ID)}`);
    expect(res.status).toBe(422);
  });
});
