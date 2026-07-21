import request from "supertest";

// All repositories mocked — app.ts mounts every router together (see
// README "Testing" for why every integration test file needs this).
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

// Mocked at the service level (not the SMTP transporter) since email is a
// pure side-effect this test suite doesn't need to exercise — see
// email.service.test.ts for real coverage of that module.
jest.mock("../../src/services/email.service", () => ({
  emailService: {
    sendEmail: jest.fn(),
    sendSessionRequestEmail: jest.fn(),
    sendSessionAcceptedEmail: jest.fn(),
  },
}));

import { createApp } from "../../src/app";
import { userRepository } from "../../src/repositories/user.repository";
import { studentProfileRepository } from "../../src/repositories/studentProfile.repository";
import { sessionRepository } from "../../src/repositories/session.repository";
import { notificationRepository } from "../../src/repositories/notification.repository";
import { signAccessToken } from "../../src/utils/jwt.util";

const mockUserRepo = userRepository as jest.Mocked<typeof userRepository>;
const mockProfileRepo = studentProfileRepository as jest.Mocked<typeof studentProfileRepository>;
const mockSessionRepo = sessionRepository as jest.Mocked<typeof sessionRepository>;
const mockNotificationRepo = notificationRepository as jest.Mocked<typeof notificationRepository>;

const app = createApp();
const REQUESTER_ID = "11111111-1111-1111-1111-111111111111";
const RECEIVER_ID = "22222222-2222-2222-2222-222222222222";
const SESSION_ID = "99999999-9999-9999-9999-999999999999";

function tokenFor(userId: string) {
  return signAccessToken({ userId, role: "STUDENT" as never });
}

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
    ...overrides,
  };
}

function makeParticipant(id: string) {
  return { id, firstName: "Ama", lastName: "Mensah", profileImage: null, email: `${id}@st.university.edu.gh` };
}

function makeSession(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: SESSION_ID,
    requesterId: REQUESTER_ID,
    receiverId: RECEIVER_ID,
    skill: "React Native",
    message: null,
    status: "PENDING",
    scheduledDate: new Date(Date.now() + 60_000),
    requester: makeParticipant(REQUESTER_ID),
    receiver: makeParticipant(RECEIVER_ID),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  // session.service always creates a notification (SESSION_REQUEST or
  // SESSION_ACCEPTED) as a side effect (Phase 8) — give it a default
  // resolved value so tests that don't care about notifications
  // specifically don't have to.
  mockNotificationRepo.create.mockResolvedValue({
    id: "notif-1",
    userId: "unused",
    title: "unused",
    message: "unused",
    type: "SESSION_REQUEST",
    isRead: false,
    createdAt: new Date(),
  } as never);
});

describe("POST /api/v1/sessions", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/v1/sessions").send({});
    expect(res.status).toBe(401);
  });

  it("rejects a past scheduledDate with 422", async () => {
    const res = await request(app)
      .post("/api/v1/sessions")
      .set("Authorization", `Bearer ${tokenFor(REQUESTER_ID)}`)
      .send({ receiverId: RECEIVER_ID, skill: "React", scheduledDate: "2020-01-01T00:00:00Z" });
    expect(res.status).toBe(422);
  });

  it("rejects requesting yourself with 400", async () => {
    const res = await request(app)
      .post("/api/v1/sessions")
      .set("Authorization", `Bearer ${tokenFor(REQUESTER_ID)}`)
      .send({
        receiverId: REQUESTER_ID,
        skill: "React",
        scheduledDate: new Date(Date.now() + 60_000).toISOString(),
      });
    expect(res.status).toBe(400);
  });

  it("creates a session request and returns 201", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(makeUser(RECEIVER_ID) as never);
    mockSessionRepo.create.mockResolvedValue(makeSession() as never);

    const res = await request(app)
      .post("/api/v1/sessions")
      .set("Authorization", `Bearer ${tokenFor(REQUESTER_ID)}`)
      .send({
        receiverId: RECEIVER_ID,
        skill: "React Native",
        scheduledDate: new Date(Date.now() + 60_000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("PENDING");
  });
});

describe("GET /api/v1/sessions/requests", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/v1/sessions/requests");
    expect(res.status).toBe(401);
  });

  it("returns paginated incoming requests", async () => {
    mockSessionRepo.list.mockResolvedValue({ items: [makeSession()] as never, totalItems: 1 });

    const res = await request(app)
      .get("/api/v1/sessions/requests")
      .set("Authorization", `Bearer ${tokenFor(RECEIVER_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data).toHaveLength(1);
    expect(res.body.data.pagination.totalItems).toBe(1);
  });
});

describe("GET /api/v1/sessions/history", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/v1/sessions/history");
    expect(res.status).toBe(401);
  });

  it("returns paginated history", async () => {
    mockSessionRepo.list.mockResolvedValue({ items: [makeSession({ status: "COMPLETED" })] as never, totalItems: 1 });

    const res = await request(app)
      .get("/api/v1/sessions/history")
      .set("Authorization", `Bearer ${tokenFor(REQUESTER_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data[0].status).toBe("COMPLETED");
  });
});

describe("PATCH /api/v1/sessions/:id/accept", () => {
  it("requires authentication", async () => {
    const res = await request(app).patch(`/api/v1/sessions/${SESSION_ID}/accept`);
    expect(res.status).toBe(401);
  });

  it("rejects a non-UUID id with 422", async () => {
    const res = await request(app)
      .patch("/api/v1/sessions/not-a-uuid/accept")
      .set("Authorization", `Bearer ${tokenFor(RECEIVER_ID)}`);
    expect(res.status).toBe(422);
  });

  it("returns 403 when the caller is not the receiver", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);

    const res = await request(app)
      .patch(`/api/v1/sessions/${SESSION_ID}/accept`)
      .set("Authorization", `Bearer ${tokenFor(REQUESTER_ID)}`);

    expect(res.status).toBe(403);
  });

  it("returns 400 when the receiver is unavailable", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);
    mockProfileRepo.findByUserId.mockResolvedValue({ isAvailable: false } as never);

    const res = await request(app)
      .patch(`/api/v1/sessions/${SESSION_ID}/accept`)
      .set("Authorization", `Bearer ${tokenFor(RECEIVER_ID)}`);

    expect(res.status).toBe(400);
  });

  it("accepts successfully when the receiver is available", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);
    mockProfileRepo.findByUserId.mockResolvedValue({ isAvailable: true } as never);
    mockSessionRepo.updateStatus.mockResolvedValue(makeSession({ status: "ACCEPTED" }) as never);

    const res = await request(app)
      .patch(`/api/v1/sessions/${SESSION_ID}/accept`)
      .set("Authorization", `Bearer ${tokenFor(RECEIVER_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ACCEPTED");
  });
});

describe("PATCH /api/v1/sessions/:id/reject", () => {
  it("returns 409 when not pending", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession({ status: "ACCEPTED" }) as never);

    const res = await request(app)
      .patch(`/api/v1/sessions/${SESSION_ID}/reject`)
      .set("Authorization", `Bearer ${tokenFor(RECEIVER_ID)}`);

    expect(res.status).toBe(409);
  });

  it("rejects successfully", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);
    mockSessionRepo.updateStatus.mockResolvedValue(makeSession({ status: "REJECTED" }) as never);

    const res = await request(app)
      .patch(`/api/v1/sessions/${SESSION_ID}/reject`)
      .set("Authorization", `Bearer ${tokenFor(RECEIVER_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("REJECTED");
  });
});

describe("PATCH /api/v1/sessions/:id/cancel", () => {
  it("returns 403 for a non-participant", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);

    const res = await request(app)
      .patch(`/api/v1/sessions/${SESSION_ID}/cancel`)
      .set("Authorization", `Bearer ${tokenFor("33333333-3333-3333-3333-333333333333")}`);

    expect(res.status).toBe(403);
  });

  it("cancels successfully for a participant", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession({ status: "ACCEPTED" }) as never);
    mockSessionRepo.updateStatus.mockResolvedValue(makeSession({ status: "CANCELLED" }) as never);

    const res = await request(app)
      .patch(`/api/v1/sessions/${SESSION_ID}/cancel`)
      .set("Authorization", `Bearer ${tokenFor(REQUESTER_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("CANCELLED");
  });
});

describe("PATCH /api/v1/sessions/:id/complete", () => {
  it("returns 409 when the session isn't accepted", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession({ status: "PENDING" }) as never);

    const res = await request(app)
      .patch(`/api/v1/sessions/${SESSION_ID}/complete`)
      .set("Authorization", `Bearer ${tokenFor(REQUESTER_ID)}`);

    expect(res.status).toBe(409);
  });

  it("completes successfully for a participant", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession({ status: "ACCEPTED" }) as never);
    mockSessionRepo.updateStatus.mockResolvedValue(makeSession({ status: "COMPLETED" }) as never);

    const res = await request(app)
      .patch(`/api/v1/sessions/${SESSION_ID}/complete`)
      .set("Authorization", `Bearer ${tokenFor(RECEIVER_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("COMPLETED");
  });
});
