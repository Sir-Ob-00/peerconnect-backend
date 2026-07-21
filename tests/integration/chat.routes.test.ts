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

jest.mock("../../src/utils/cloudinaryUpload.util", () => ({
  uploadImageBuffer: jest.fn(),
  uploadChatImageBuffer: jest.fn(),
}));

import { createApp } from "../../src/app";
import { conversationRepository } from "../../src/repositories/conversation.repository";
import { messageRepository } from "../../src/repositories/message.repository";
import { uploadChatImageBuffer } from "../../src/utils/cloudinaryUpload.util";
import { signAccessToken } from "../../src/utils/jwt.util";

const mockConversationRepo = conversationRepository as jest.Mocked<typeof conversationRepository>;
const mockMessageRepo = messageRepository as jest.Mocked<typeof messageRepository>;
const mockUpload = uploadChatImageBuffer as jest.MockedFunction<typeof uploadChatImageBuffer>;

const app = createApp();
const USER_A = "11111111-1111-1111-1111-111111111111";
const USER_B = "22222222-2222-2222-2222-222222222222";
const OUTSIDER = "33333333-3333-3333-3333-333333333333";
const CONVERSATION_ID = "44444444-4444-4444-4444-444444444444";

function tokenFor(userId: string) {
  return signAccessToken({ userId, role: "STUDENT" as never });
}

function makeParticipant(id: string) {
  return { id, firstName: "Ama", lastName: "Mensah", profileImage: null };
}

function makeConversation(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: CONVERSATION_ID,
    userOneId: USER_A,
    userTwoId: USER_B,
    userOne: makeParticipant(USER_A),
    userTwo: makeParticipant(USER_B),
    createdAt: new Date(),
    ...overrides,
  };
}

function makeMessage(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "msg-1",
    conversationId: CONVERSATION_ID,
    senderId: USER_A,
    content: "Hello!",
    imageUrl: null,
    isRead: false,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("GET /api/v1/chat/conversations", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/v1/chat/conversations");
    expect(res.status).toBe(401);
  });

  it("returns the user's conversations with unread counts", async () => {
    mockConversationRepo.listForUser.mockResolvedValue([makeConversation({ messages: [makeMessage()] })] as never);
    mockMessageRepo.countUnread.mockResolvedValue(1);

    const res = await request(app)
      .get("/api/v1/chat/conversations")
      .set("Authorization", `Bearer ${tokenFor(USER_A)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].unreadCount).toBe(1);
    expect(res.body.data[0].participant.id).toBe(USER_B);
  });
});

describe("GET /api/v1/chat/:conversationId/messages", () => {
  it("requires authentication", async () => {
    const res = await request(app).get(`/api/v1/chat/${CONVERSATION_ID}/messages`);
    expect(res.status).toBe(401);
  });

  it("rejects a non-UUID conversationId with 422", async () => {
    const res = await request(app)
      .get("/api/v1/chat/not-a-uuid/messages")
      .set("Authorization", `Bearer ${tokenFor(USER_A)}`);
    expect(res.status).toBe(422);
  });

  it("returns 403 for a non-participant", async () => {
    mockConversationRepo.findById.mockResolvedValue(makeConversation() as never);

    const res = await request(app)
      .get(`/api/v1/chat/${CONVERSATION_ID}/messages`)
      .set("Authorization", `Bearer ${tokenFor(OUTSIDER)}`);

    expect(res.status).toBe(403);
  });

  it("returns 404 when the conversation doesn't exist", async () => {
    mockConversationRepo.findById.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/v1/chat/${CONVERSATION_ID}/messages`)
      .set("Authorization", `Bearer ${tokenFor(USER_A)}`);

    expect(res.status).toBe(404);
  });

  it("returns paginated messages for a participant", async () => {
    mockConversationRepo.findById.mockResolvedValue(makeConversation() as never);
    mockMessageRepo.listByConversation.mockResolvedValue({ items: [makeMessage()], totalItems: 1 });

    const res = await request(app)
      .get(`/api/v1/chat/${CONVERSATION_ID}/messages`)
      .set("Authorization", `Bearer ${tokenFor(USER_A)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data).toHaveLength(1);
    expect(res.body.data.pagination.totalItems).toBe(1);
  });
});

describe("POST /api/v1/chat/upload-image", () => {
  it("requires authentication", async () => {
    const res = await request(app)
      .post("/api/v1/chat/upload-image")
      .attach("image", Buffer.from("fake-image-bytes"), { filename: "photo.jpg", contentType: "image/jpeg" });
    expect(res.status).toBe(401);
  });

  it("rejects a request with no file attached", async () => {
    const res = await request(app)
      .post("/api/v1/chat/upload-image")
      .set("Authorization", `Bearer ${tokenFor(USER_A)}`);
    expect(res.status).toBe(400);
  });

  it("rejects a non-image file with 400", async () => {
    const res = await request(app)
      .post("/api/v1/chat/upload-image")
      .set("Authorization", `Bearer ${tokenFor(USER_A)}`)
      .attach("image", Buffer.from("not an image"), { filename: "notes.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
  });

  it("uploads a valid image and returns its URL", async () => {
    mockUpload.mockResolvedValue({ secureUrl: "https://res.cloudinary.com/demo/chat.jpg", publicId: "chat-1" });

    const res = await request(app)
      .post("/api/v1/chat/upload-image")
      .set("Authorization", `Bearer ${tokenFor(USER_A)}`)
      .attach("image", Buffer.from("fake-image-bytes"), { filename: "photo.jpg", contentType: "image/jpeg" });

    expect(res.status).toBe(200);
    expect(res.body.data.imageUrl).toBe("https://res.cloudinary.com/demo/chat.jpg");
  });
});
