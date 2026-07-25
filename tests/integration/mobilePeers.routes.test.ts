import request from "supertest";

jest.mock("../../src/repositories/studentProfile.repository", () => ({
  studentProfileRepository: {
    findByUserId: jest.fn(),
  },
}));

jest.mock("../../src/repositories/peer.repository", () => ({
  peerRepository: {
    search: jest.fn(),
    findByIds: jest.fn(),
    findConnectionBetween: jest.fn(),
    findPendingConnections: jest.fn(),
    findAcceptedConnections: jest.fn(),
    findBlockedUsers: jest.fn(),
    createConnection: jest.fn(),
    acceptConnection: jest.fn(),
    rejectConnection: jest.fn(),
    deleteConnection: jest.fn(),
    blockUser: jest.fn(),
    unblockUser: jest.fn(),
    isBlocked: jest.fn(),
    findSharedGroups: jest.fn(),
    findMutualConnections: jest.fn(),
    findRecommendationCandidates: jest.fn(),
    findUserById: jest.fn(),
    findConnectionById: jest.fn(),
  },
}));

import { createApp } from "../../src/app";
import { studentProfileRepository } from "../../src/repositories/studentProfile.repository";
import { peerRepository } from "../../src/repositories/peer.repository";
import { signAccessToken } from "../../src/utils/jwt.util";

const mockProfileRepo = studentProfileRepository as jest.Mocked<typeof studentProfileRepository>;
const mockPeerRepo = peerRepository as jest.Mocked<typeof peerRepository>;

const app = createApp();
const ME_ID = "11111111-1111-1111-1111-111111111111";

function tokenFor(userId: string) {
  return signAccessToken({ userId, role: "STUDENT" as never });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/v1/mobile/peers/recommended", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/v1/mobile/peers/recommended");
    expect(res.status).toBe(401);
  });

  it("returns empty array when caller has no profile", async () => {
    mockProfileRepo.findByUserId.mockResolvedValue(null as never);

    const res = await request(app)
      .get("/api/v1/mobile/peers/recommended")
      .set("Authorization", `Bearer ${tokenFor(ME_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data).toEqual([]);
  });
});

describe("GET /api/v1/mobile/peers", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/v1/mobile/peers");
    expect(res.status).toBe(401);
  });

  it("returns paginated peers", async () => {
    mockPeerRepo.search.mockResolvedValue({
      items: [],
      totalItems: 0,
    });

    const res = await request(app)
      .get("/api/v1/mobile/peers?page=1&limit=10")
      .set("Authorization", `Bearer ${tokenFor(ME_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data).toEqual([]);
    expect(res.body.data.pagination.totalItems).toBe(0);
  });
});

describe("GET /api/v1/mobile/peers/:userId", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/v1/mobile/peers/22222222-2222-2222-2222-222222222222");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/mobile/peers/connections/request", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/v1/mobile/peers/connections/request").send({ userId: "22222222-2222-2222-2222-222222222222" });
    expect(res.status).toBe(401);
  });

  it("rejects self-request", async () => {
    const res = await request(app)
      .post("/api/v1/mobile/peers/connections/request")
      .set("Authorization", `Bearer ${tokenFor(ME_ID)}`)
      .send({ userId: ME_ID });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/mobile/peers/connections/accept", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/v1/mobile/peers/connections/accept").send({ connectionId: "conn-1" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/mobile/peers/connections/reject", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/v1/mobile/peers/connections/reject").send({ connectionId: "conn-1" });
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/v1/mobile/peers/connections/:connectionId", () => {
  it("requires authentication", async () => {
    const res = await request(app).delete("/api/v1/mobile/peers/connections/conn-1");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/mobile/peers/block", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/v1/mobile/peers/block").send({ userId: "22222222-2222-2222-2222-222222222222" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/mobile/peers/unblock", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/v1/mobile/peers/unblock").send({ userId: "22222222-2222-2222-2222-222222222222" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/mobile/peers/connections", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/v1/mobile/peers/connections");
    expect(res.status).toBe(401);
  });
});
