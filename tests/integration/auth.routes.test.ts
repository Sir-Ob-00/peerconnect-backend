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

describe("POST /api/v1/auth/register", () => {
  it("rejects a weak password with 422", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      firstName: "Ama",
      lastName: "Mensah",
      email: "ama@uni.edu.gh",
      password: "weak",
      confirmPassword: "weak",
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(expect.any(Array));
  });

  it("rejects mismatched password confirmation with 422", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      firstName: "Ama",
      lastName: "Mensah",
      email: "ama@uni.edu.gh",
      password: "StrongPass1!",
      confirmPassword: "Different1!",
    });
    expect(res.status).toBe(422);
  });

  it("registers successfully and returns 201 with user + tokens, no password field", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue(makeUser() as never);

    const res = await request(app).post("/api/v1/auth/register").send({
      firstName: "Ama",
      lastName: "Mensah",
      email: "ama.mensah@st.university.edu.gh",
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("ama.mensah@st.university.edu.gh");
    expect(res.body.data.user).not.toHaveProperty("password");
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.refreshToken).toEqual(expect.any(String));
  });

  it("returns 409 for a duplicate email", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(makeUser() as never);

    const res = await request(app).post("/api/v1/auth/register").send({
      firstName: "Ama",
      lastName: "Mensah",
      email: "ama.mensah@st.university.edu.gh",
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/v1/auth/login", () => {
  it("returns 401 for a wrong password", async () => {
    const hashed = await hashPassword("CorrectPass1!");
    mockUserRepo.findByEmail.mockResolvedValue(makeUser({ password: hashed }) as never);

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "ama.mensah@st.university.edu.gh", password: "WrongPass1!" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 403 for a suspended account", async () => {
    const hashed = await hashPassword("CorrectPass1!");
    mockUserRepo.findByEmail.mockResolvedValue(
      makeUser({ password: hashed, accountStatus: "SUSPENDED" }) as never
    );

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "ama.mensah@st.university.edu.gh", password: "CorrectPass1!" });

    expect(res.status).toBe(403);
  });

  it("logs in successfully and returns the expected envelope", async () => {
    const hashed = await hashPassword("CorrectPass1!");
    mockUserRepo.findByEmail.mockResolvedValue(makeUser({ password: hashed }) as never);

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "ama.mensah@st.university.edu.gh", password: "CorrectPass1!" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: "Login successful." });
    expect(res.body.data.accessToken).toEqual(expect.any(String));
  });
});

describe("GET /api/v1/auth/me", () => {
  it("returns 401 without an Authorization header", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 with a garbage token", async () => {
    const res = await request(app).get("/api/v1/auth/me").set("Authorization", "Bearer garbage");
    expect(res.status).toBe(401);
  });

  it("returns the current user with a valid token", async () => {
    const user = makeUser();
    mockUserRepo.findActiveById.mockResolvedValue(user as never);
    const token = signAccessToken({ userId: user.id, role: user.role as never });

    const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(user.id);
    expect(res.body.data).not.toHaveProperty("password");
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
    // The email in the mocked update call should not include the attempted email override.
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
