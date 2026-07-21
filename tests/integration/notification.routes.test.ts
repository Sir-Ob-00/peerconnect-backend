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

// session.routes is mounted in the same app; mocked here purely so
// importing app.ts never risks a real SMTP call (it wouldn't anyway, since
// this file never exercises those endpoints — see the note in
// session.routes.test.ts on why this is safe either way).
jest.mock("../../src/services/email.service", () => ({
  emailService: {
    sendEmail: jest.fn(),
    sendSessionRequestEmail: jest.fn(),
    sendSessionAcceptedEmail: jest.fn(),
  },
}));

import { createApp } from "../../src/app";
import { notificationRepository } from "../../src/repositories/notification.repository";
import { signAccessToken } from "../../src/utils/jwt.util";

const mockNotificationRepo = notificationRepository as jest.Mocked<typeof notificationRepository>;

const app = createApp();
const USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "22222222-2222-2222-2222-222222222222";
const NOTIFICATION_ID = "44444444-4444-4444-4444-444444444444";

function tokenFor(userId: string) {
  return signAccessToken({ userId, role: "STUDENT" as never });
}

function makeNotification(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: NOTIFICATION_ID,
    userId: USER_ID,
    title: "New session request",
    message: "Ama Mensah requested a session with you on React Native.",
    type: "SESSION_REQUEST",
    isRead: false,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("GET /api/v1/notifications", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/v1/notifications");
    expect(res.status).toBe(401);
  });

  it("returns paginated notifications with an unread count", async () => {
    mockNotificationRepo.listByUser.mockResolvedValue({ items: [makeNotification()], totalItems: 1 });
    mockNotificationRepo.countUnread.mockResolvedValue(1);

    const res = await request(app).get("/api/v1/notifications").set("Authorization", `Bearer ${tokenFor(USER_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data).toHaveLength(1);
    expect(res.body.data.unreadCount).toBe(1);
  });

  it("rejects an out-of-range limit with 422", async () => {
    const res = await request(app)
      .get("/api/v1/notifications?limit=500")
      .set("Authorization", `Bearer ${tokenFor(USER_ID)}`);
    expect(res.status).toBe(422);
  });
});

describe("PATCH /api/v1/notifications/:id/read", () => {
  it("requires authentication", async () => {
    const res = await request(app).patch(`/api/v1/notifications/${NOTIFICATION_ID}/read`);
    expect(res.status).toBe(401);
  });

  it("rejects a non-UUID id with 422", async () => {
    const res = await request(app)
      .patch("/api/v1/notifications/not-a-uuid/read")
      .set("Authorization", `Bearer ${tokenFor(USER_ID)}`);
    expect(res.status).toBe(422);
  });

  it("returns 403 when the notification belongs to someone else", async () => {
    mockNotificationRepo.findById.mockResolvedValue(makeNotification({ userId: OTHER_USER_ID }) as never);

    const res = await request(app)
      .patch(`/api/v1/notifications/${NOTIFICATION_ID}/read`)
      .set("Authorization", `Bearer ${tokenFor(USER_ID)}`);

    expect(res.status).toBe(403);
  });

  it("returns 404 when the notification doesn't exist", async () => {
    mockNotificationRepo.findById.mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/v1/notifications/${NOTIFICATION_ID}/read`)
      .set("Authorization", `Bearer ${tokenFor(USER_ID)}`);

    expect(res.status).toBe(404);
  });

  it("marks the notification read", async () => {
    mockNotificationRepo.findById.mockResolvedValue(makeNotification({ isRead: false }) as never);
    mockNotificationRepo.markRead.mockResolvedValue(makeNotification({ isRead: true }) as never);

    const res = await request(app)
      .patch(`/api/v1/notifications/${NOTIFICATION_ID}/read`)
      .set("Authorization", `Bearer ${tokenFor(USER_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isRead).toBe(true);
  });
});
