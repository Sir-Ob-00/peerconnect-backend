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
import { userRepository } from "../../src/repositories/user.repository";
import { sessionRepository } from "../../src/repositories/session.repository";
import { reviewRepository } from "../../src/repositories/review.repository";
import { signAccessToken } from "../../src/utils/jwt.util";

const mockUserRepo = userRepository as jest.Mocked<typeof userRepository>;
const mockSessionRepo = sessionRepository as jest.Mocked<typeof sessionRepository>;
const mockReviewRepo = reviewRepository as jest.Mocked<typeof reviewRepository>;

const app = createApp();
const REQUESTER_ID = "11111111-1111-1111-1111-111111111111";
const RECEIVER_ID = "22222222-2222-2222-2222-222222222222";
const SESSION_ID = "44444444-4444-4444-4444-444444444444";

function tokenFor(userId: string) {
  return signAccessToken({ userId, role: "STUDENT" as never });
}

function makeSession(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: SESSION_ID,
    requesterId: REQUESTER_ID,
    receiverId: RECEIVER_ID,
    skill: "React Native",
    message: null,
    status: "COMPLETED",
    scheduledDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeReview(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "review-1",
    sessionId: SESSION_ID,
    reviewerId: REQUESTER_ID,
    receiverId: RECEIVER_ID,
    rating: 5,
    comment: "Great session!",
    createdAt: new Date(),
    reviewer: { id: REQUESTER_ID, firstName: "Ama", lastName: "Mensah", profileImage: null },
    ...overrides,
  };
}

describe("POST /api/v1/reviews", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/v1/reviews").send({ sessionId: SESSION_ID, rating: 5 });
    expect(res.status).toBe(401);
  });

  it("rejects a rating outside 1-5 with 422", async () => {
    const res = await request(app)
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${tokenFor(REQUESTER_ID)}`)
      .send({ sessionId: SESSION_ID, rating: 7 });
    expect(res.status).toBe(422);
  });

  it("rejects a non-integer rating with 422", async () => {
    const res = await request(app)
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${tokenFor(REQUESTER_ID)}`)
      .send({ sessionId: SESSION_ID, rating: 4.5 });
    expect(res.status).toBe(422);
  });

  it("returns 400 when the session is not completed", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession({ status: "ACCEPTED" }) as never);

    const res = await request(app)
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${tokenFor(REQUESTER_ID)}`)
      .send({ sessionId: SESSION_ID, rating: 5 });

    expect(res.status).toBe(400);
  });

  it("returns 409 when the session was already reviewed", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);
    mockReviewRepo.findBySessionId.mockResolvedValue(makeReview() as never);

    const res = await request(app)
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${tokenFor(REQUESTER_ID)}`)
      .send({ sessionId: SESSION_ID, rating: 5 });

    expect(res.status).toBe(409);
  });

  it("creates a review and returns 201", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);
    mockReviewRepo.findBySessionId.mockResolvedValue(null);
    mockReviewRepo.create.mockResolvedValue(makeReview() as never);

    const res = await request(app)
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${tokenFor(REQUESTER_ID)}`)
      .send({ sessionId: SESSION_ID, rating: 5, comment: "Great session!" });

    expect(res.status).toBe(201);
    expect(res.body.data.rating).toBe(5);
  });
});

describe("GET /api/v1/reviews/:userId", () => {
  it("does not require authentication", async () => {
    mockUserRepo.findActiveById.mockResolvedValue({ id: RECEIVER_ID } as never);
    mockReviewRepo.listByReceiver.mockResolvedValue({ items: [makeReview()], totalItems: 1 });
    mockReviewRepo.getRatingSummary.mockResolvedValue({ averageRating: 5, totalReviews: 1 });

    const res = await request(app).get(`/api/v1/reviews/${RECEIVER_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data).toHaveLength(1);
    expect(res.body.data.summary).toEqual({ averageRating: 5, totalReviews: 1 });
  });

  it("rejects a non-UUID userId with 422", async () => {
    const res = await request(app).get("/api/v1/reviews/not-a-uuid");
    expect(res.status).toBe(422);
  });

  it("returns 404 for a user that doesn't exist", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(null);
    const res = await request(app).get(`/api/v1/reviews/${RECEIVER_ID}`);
    expect(res.status).toBe(404);
  });

  it("returns a clean zero-review summary for a user with no reviews", async () => {
    mockUserRepo.findActiveById.mockResolvedValue({ id: RECEIVER_ID } as never);
    mockReviewRepo.listByReceiver.mockResolvedValue({ items: [], totalItems: 0 });
    mockReviewRepo.getRatingSummary.mockResolvedValue({ averageRating: 0, totalReviews: 0 });

    const res = await request(app).get(`/api/v1/reviews/${RECEIVER_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data).toEqual([]);
    expect(res.body.data.summary).toEqual({ averageRating: 0, totalReviews: 0 });
  });
});
