import request from "supertest";

jest.mock("../../src/repositories/user.repository", () => ({
  userRepository: {
    findActiveById: jest.fn(),
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

jest.mock("../../src/utils/cloudinaryUpload.util", () => ({
  uploadImageBuffer: jest.fn(),
}));

// app.ts mounts every router, including /auth and /users — so these must be
// mocked here too even though this file only exercises /profile routes, or
// importing app.ts would try to construct a real PrismaClient.
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

// app.ts mounts every router, including /students — so this must be mocked
// here too even though this file only exercises /profile routes, or
// importing app.ts would try to construct a real PrismaClient.
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
import { studentProfileRepository } from "../../src/repositories/studentProfile.repository";
import { uploadImageBuffer } from "../../src/utils/cloudinaryUpload.util";
import { signAccessToken } from "../../src/utils/jwt.util";

const mockUserRepo = userRepository as jest.Mocked<typeof userRepository>;
const mockProfileRepo = studentProfileRepository as jest.Mocked<typeof studentProfileRepository>;
const mockUpload = uploadImageBuffer as jest.MockedFunction<typeof uploadImageBuffer>;

const app = createApp();
const USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "22222222-2222-2222-2222-222222222222";

function makeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: USER_ID,
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

function makeProfile(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "profile-1",
    userId: USER_ID,
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

describe("GET /api/v1/profile/me", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/v1/profile/me");
    expect(res.status).toBe(401);
  });

  it("returns user + profile", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(makeUser() as never);
    mockProfileRepo.getOrCreateByUserId.mockResolvedValue(makeProfile({ department: "Computer Science" }) as never);

    const res = await request(app).get("/api/v1/profile/me").set("Authorization", `Bearer ${tokenFor(USER_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("ama.mensah@st.university.edu.gh");
    expect(res.body.data.profile.department).toBe("Computer Science");
  });
});

describe("PATCH /api/v1/profile/me", () => {
  it("requires authentication", async () => {
    const res = await request(app).patch("/api/v1/profile/me").send({ bio: "hi" });
    expect(res.status).toBe(401);
  });

  it("rejects an empty body with 422", async () => {
    const res = await request(app)
      .patch("/api/v1/profile/me")
      .set("Authorization", `Bearer ${tokenFor(USER_ID)}`)
      .send({});
    expect(res.status).toBe(422);
  });

  it("rejects a bio over the length limit with 422", async () => {
    const res = await request(app)
      .patch("/api/v1/profile/me")
      .set("Authorization", `Bearer ${tokenFor(USER_ID)}`)
      .send({ bio: "x".repeat(501) });
    expect(res.status).toBe(422);
  });

  it("updates the profile and returns it", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(makeUser() as never);
    mockProfileRepo.updateByUserId.mockResolvedValue(
      makeProfile({ department: "Computer Science", skills: ["React Native", "UI Design"] }) as never
    );

    const res = await request(app)
      .patch("/api/v1/profile/me")
      .set("Authorization", `Bearer ${tokenFor(USER_ID)}`)
      .send({ department: "Computer Science", skills: ["React Native", "UI Design"] });

    expect(res.status).toBe(200);
    expect(res.body.data.department).toBe("Computer Science");
    expect(res.body.data.skills).toEqual(["React Native", "UI Design"]);
  });
});

describe("POST /api/v1/profile/photo", () => {
  it("requires authentication", async () => {
    const res = await request(app)
      .post("/api/v1/profile/photo")
      .attach("photo", Buffer.from("fake-image-bytes"), { filename: "avatar.jpg", contentType: "image/jpeg" });
    expect(res.status).toBe(401);
  });

  it("rejects a request with no file attached", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(makeUser() as never);

    const res = await request(app).post("/api/v1/profile/photo").set("Authorization", `Bearer ${tokenFor(USER_ID)}`);

    expect(res.status).toBe(400);
  });

  it("rejects a non-image file with 400", async () => {
    const res = await request(app)
      .post("/api/v1/profile/photo")
      .set("Authorization", `Bearer ${tokenFor(USER_ID)}`)
      .attach("photo", Buffer.from("not an image"), { filename: "notes.txt", contentType: "text/plain" });

    expect(res.status).toBe(400);
  });

  it("uploads a valid image, calls Cloudinary, and returns the updated profile", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(makeUser() as never);
    mockUpload.mockResolvedValue({
      secureUrl: "https://res.cloudinary.com/demo/image/upload/user_1.jpg",
      publicId: `user_${USER_ID}`,
    });
    mockProfileRepo.setProfilePhoto.mockResolvedValue(
      makeProfile({ profilePhoto: "https://res.cloudinary.com/demo/image/upload/user_1.jpg" }) as never
    );

    const res = await request(app)
      .post("/api/v1/profile/photo")
      .set("Authorization", `Bearer ${tokenFor(USER_ID)}`)
      .attach("photo", Buffer.from("fake-image-bytes"), { filename: "avatar.jpg", contentType: "image/jpeg" });

    expect(res.status).toBe(200);
    expect(res.body.data.profilePhoto).toBe("https://res.cloudinary.com/demo/image/upload/user_1.jpg");
    expect(mockUpload).toHaveBeenCalledTimes(1);
  });
});

describe("GET /api/v1/profile/:id", () => {
  it("does not require authentication", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(makeUser({ id: OTHER_USER_ID }) as never);
    mockProfileRepo.findByUserId.mockResolvedValue(
      makeProfile({ userId: OTHER_USER_ID, department: "Mathematics" }) as never
    );

    const res = await request(app).get(`/api/v1/profile/${OTHER_USER_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.data.department).toBe("Mathematics");
    expect(res.body.data).not.toHaveProperty("email");
  });

  it("rejects a non-UUID id with 422", async () => {
    const res = await request(app).get("/api/v1/profile/not-a-uuid");
    expect(res.status).toBe(422);
  });

  it("returns 404 for a user that doesn't exist", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(null);
    const res = await request(app).get(`/api/v1/profile/${OTHER_USER_ID}`);
    expect(res.status).toBe(404);
  });
});
