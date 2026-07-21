import request from "supertest";

jest.mock("../../src/repositories/user.repository", () => ({
  userRepository: {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findActiveById: jest.fn(),
    findActiveByEmail: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
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

// app.ts mounts every router, including /profile and /students — so these
// must be mocked here too even though this file only exercises /auth and
// /users routes, or importing app.ts would try to construct a real PrismaClient.
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
import { refreshTokenRepository } from "../../src/repositories/refreshToken.repository";
import { hashPassword } from "../../src/utils/password.util";
import { signAccessToken } from "../../src/utils/jwt.util";

const mockUserRepo = userRepository as jest.Mocked<typeof userRepository>;
const mockRefreshRepo = refreshTokenRepository as jest.Mocked<typeof refreshTokenRepository>;

const app = createApp();

function makeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    firstName: "Ama",
    lastName: "Mensah",
    email: "ama.mensah@st.university.edu.gh",
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

beforeEach(() => {
  mockRefreshRepo.create.mockResolvedValue({} as never);
});

describe("GET /api/v1/health", () => {
  it("returns the expected success envelope", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: "Server is running" });
  });
});

describe("GET /unknown-route", () => {
  it("returns a 404 error envelope", async () => {
    const res = await request(app).get("/api/v1/this-does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/route not found/i);
  });
});

describe("POST /api/v1/auth/refresh", () => {
  it("returns 401 for an invalid refresh token", async () => {
    const res = await request(app).post("/api/v1/auth/refresh").send({ refreshToken: "bad" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/v1/auth/logout", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/v1/auth/logout").send({});
    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/auth/forgot-password", () => {
  it("returns 404 when the email does not exist", async () => {
    mockUserRepo.findActiveByEmail.mockResolvedValue(null);
    const res = await request(app).post("/api/v1/auth/forgot-password").send({ email: "nope@example.com" });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/v1/auth/reset-password", () => {
  it("returns 400 for an invalid token", async () => {
    const res = await request(app).post("/api/v1/auth/reset-password").send({
      token: "bad",
      password: "NewStrongPass1!",
      confirmPassword: "NewStrongPass1!",
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });
});

describe("PATCH /api/v1/auth/change-password", () => {
  it("requires authentication", async () => {
    const res = await request(app).patch("/api/v1/auth/change-password").send({
      currentPassword: "OldPass1!",
      newPassword: "NewStrongPass1!",
      confirmPassword: "NewStrongPass1!",
    });
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/v1/users/me", () => {
  it("requires authentication", async () => {
    const res = await request(app).patch("/api/v1/users/me").send({ firstName: "New" });
    expect(res.status).toBe(401);
  });

  it("rejects an empty update body with 422", async () => {
    const user = makeUser();
    const token = signAccessToken({ userId: user.id, role: user.role as never });

    const res = await request(app).patch("/api/v1/users/me").set("Authorization", `Bearer ${token}`).send({});

    expect(res.status).toBe(422);
  });

  it("updates the profile and never accepts an email field change", async () => {
    const user = makeUser();
    mockUserRepo.findActiveById.mockResolvedValue(user as never);
    mockUserRepo.update.mockResolvedValue(makeUser({ firstName: "Akosua" }) as never);
    const token = signAccessToken({ userId: user.id, role: user.role as never });

    const res = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "Akosua", email: "hacker@evil.com" });

    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe("Akosua");
    const updateArg = mockUserRepo.update.mock.calls[0][1] as Record<string, unknown>;
    expect(updateArg).not.toHaveProperty("email");
  });
});

describe("DELETE /api/v1/users/me", () => {
  it("requires authentication", async () => {
    const res = await request(app).delete("/api/v1/users/me");
    expect(res.status).toBe(401);
  });

  it("soft-deletes the account", async () => {
    const user = makeUser();
    mockUserRepo.findActiveById.mockResolvedValue(user as never);
    const token = signAccessToken({ userId: user.id, role: user.role as never });

    const res = await request(app).delete("/api/v1/users/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(mockUserRepo.softDelete).toHaveBeenCalledWith(user.id);
  });
});
