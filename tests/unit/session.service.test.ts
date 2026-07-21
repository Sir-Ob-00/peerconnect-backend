jest.mock("../../src/repositories/session.repository", () => ({
  sessionRepository: {
    create: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    updateStatus: jest.fn(),
  },
}));

jest.mock("../../src/repositories/user.repository", () => ({
  userRepository: {
    findActiveById: jest.fn(),
  },
}));

jest.mock("../../src/repositories/studentProfile.repository", () => ({
  studentProfileRepository: {
    findByUserId: jest.fn(),
  },
}));

// Mocked at the service level — session.service's use of these is a pure
// side effect (fire a notification, send an email); their own logic is
// covered by notification.service.test.ts and email.service.test.ts.
jest.mock("../../src/services/notification.service", () => ({
  notificationService: {
    createNotification: jest.fn(),
  },
}));

jest.mock("../../src/services/email.service", () => ({
  emailService: {
    sendEmail: jest.fn(),
    sendSessionRequestEmail: jest.fn(),
    sendSessionAcceptedEmail: jest.fn(),
  },
}));

import { sessionService } from "../../src/services/session.service";
import { sessionRepository } from "../../src/repositories/session.repository";
import { userRepository } from "../../src/repositories/user.repository";
import { studentProfileRepository } from "../../src/repositories/studentProfile.repository";
import { notificationService } from "../../src/services/notification.service";
import { emailService } from "../../src/services/email.service";

const mockSessionRepo = sessionRepository as jest.Mocked<typeof sessionRepository>;
const mockUserRepo = userRepository as jest.Mocked<typeof userRepository>;
const mockProfileRepo = studentProfileRepository as jest.Mocked<typeof studentProfileRepository>;
const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;
const mockEmailService = emailService as jest.Mocked<typeof emailService>;

const REQUESTER_ID = "11111111-1111-1111-1111-111111111111";
const RECEIVER_ID = "22222222-2222-2222-2222-222222222222";
const OUTSIDER_ID = "33333333-3333-3333-3333-333333333333";
const SESSION_ID = "sess-1";

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

function makeProfile(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "profile-1",
    userId: RECEIVER_ID,
    department: null,
    level: null,
    skills: [],
    learningInterests: [],
    bio: null,
    availability: null,
    isAvailable: true,
    profilePhoto: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("sessionService.requestSession", () => {
  const validInput = {
    receiverId: RECEIVER_ID,
    skill: "React Native",
    message: "Can you help?",
    scheduledDate: new Date(Date.now() + 60_000),
  };

  it("rejects requesting a session with yourself", async () => {
    await expect(sessionService.requestSession(REQUESTER_ID, { ...validInput, receiverId: REQUESTER_ID })).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(mockSessionRepo.create).not.toHaveBeenCalled();
  });

  it("rejects when the receiver doesn't exist", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(null);
    await expect(sessionService.requestSession(REQUESTER_ID, validInput)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("creates a PENDING session request", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(makeUser(RECEIVER_ID) as never);
    mockSessionRepo.create.mockResolvedValue(makeSession() as never);

    const result = await sessionService.requestSession(REQUESTER_ID, validInput);

    expect(mockSessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ requesterId: REQUESTER_ID, receiverId: RECEIVER_ID, skill: "React Native" })
    );
    expect(result.status).toBe("PENDING");
  });
});

describe("sessionService.listIncomingRequests / listHistory", () => {
  it("scopes incoming requests to receiverId + PENDING status", async () => {
    mockSessionRepo.list.mockResolvedValue({ items: [], totalItems: 0 });

    await sessionService.listIncomingRequests(RECEIVER_ID, 1, 10);

    expect(mockSessionRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({ where: { receiverId: RECEIVER_ID, status: "PENDING" } })
    );
  });

  it("scopes history to sessions sent OR received by the user", async () => {
    mockSessionRepo.list.mockResolvedValue({ items: [], totalItems: 0 });

    await sessionService.listHistory(REQUESTER_ID, 1, 10);

    expect(mockSessionRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ requesterId: REQUESTER_ID }, { receiverId: REQUESTER_ID }] },
      })
    );
  });
});

describe("sessionService.acceptSession", () => {
  it("throws 404 when the session doesn't exist", async () => {
    mockSessionRepo.findById.mockResolvedValue(null);
    await expect(sessionService.acceptSession(SESSION_ID, RECEIVER_ID)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 403 when the caller is not the receiver", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);
    await expect(sessionService.acceptSession(SESSION_ID, OUTSIDER_ID)).rejects.toMatchObject({ statusCode: 403 });
    await expect(sessionService.acceptSession(SESSION_ID, REQUESTER_ID)).rejects.toMatchObject({ statusCode: 403 });
  });

  it("throws 409 when the session is not PENDING", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession({ status: "ACCEPTED" }) as never);
    await expect(sessionService.acceptSession(SESSION_ID, RECEIVER_ID)).rejects.toMatchObject({ statusCode: 409 });
  });

  it("throws 400 when the receiver is marked unavailable", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);
    mockProfileRepo.findByUserId.mockResolvedValue(makeProfile({ isAvailable: false }) as never);

    await expect(sessionService.acceptSession(SESSION_ID, RECEIVER_ID)).rejects.toMatchObject({ statusCode: 400 });
    expect(mockSessionRepo.updateStatus).not.toHaveBeenCalled();
  });

  it("accepts when the receiver has no profile yet (defaults to available)", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);
    mockProfileRepo.findByUserId.mockResolvedValue(null);
    mockSessionRepo.updateStatus.mockResolvedValue(makeSession({ status: "ACCEPTED" }) as never);

    const result = await sessionService.acceptSession(SESSION_ID, RECEIVER_ID);

    expect(result.status).toBe("ACCEPTED");
  });

  it("accepts when the receiver is available", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);
    mockProfileRepo.findByUserId.mockResolvedValue(makeProfile({ isAvailable: true }) as never);
    mockSessionRepo.updateStatus.mockResolvedValue(makeSession({ status: "ACCEPTED" }) as never);

    const result = await sessionService.acceptSession(SESSION_ID, RECEIVER_ID);

    expect(mockSessionRepo.updateStatus).toHaveBeenCalledWith(SESSION_ID, "ACCEPTED");
    expect(result.status).toBe("ACCEPTED");
  });
});

describe("sessionService.rejectSession", () => {
  it("throws 403 when the caller is not the receiver", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);
    await expect(sessionService.rejectSession(SESSION_ID, REQUESTER_ID)).rejects.toMatchObject({ statusCode: 403 });
  });

  it("throws 409 when the session is not PENDING", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession({ status: "COMPLETED" }) as never);
    await expect(sessionService.rejectSession(SESSION_ID, RECEIVER_ID)).rejects.toMatchObject({ statusCode: 409 });
  });

  it("rejects a pending session", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);
    mockSessionRepo.updateStatus.mockResolvedValue(makeSession({ status: "REJECTED" }) as never);

    const result = await sessionService.rejectSession(SESSION_ID, RECEIVER_ID);

    expect(mockSessionRepo.updateStatus).toHaveBeenCalledWith(SESSION_ID, "REJECTED");
    expect(result.status).toBe("REJECTED");
  });
});

describe("sessionService.cancelSession", () => {
  it("throws 403 when the caller is not a participant", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);
    await expect(sessionService.cancelSession(SESSION_ID, OUTSIDER_ID)).rejects.toMatchObject({ statusCode: 403 });
  });

  it("allows the requester to cancel a pending session", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession({ status: "PENDING" }) as never);
    mockSessionRepo.updateStatus.mockResolvedValue(makeSession({ status: "CANCELLED" }) as never);

    const result = await sessionService.cancelSession(SESSION_ID, REQUESTER_ID);
    expect(result.status).toBe("CANCELLED");
  });

  it("allows the receiver to cancel an accepted session", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession({ status: "ACCEPTED" }) as never);
    mockSessionRepo.updateStatus.mockResolvedValue(makeSession({ status: "CANCELLED" }) as never);

    const result = await sessionService.cancelSession(SESSION_ID, RECEIVER_ID);
    expect(result.status).toBe("CANCELLED");
  });

  it("throws 409 when the session is already in a terminal state", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession({ status: "COMPLETED" }) as never);
    await expect(sessionService.cancelSession(SESSION_ID, REQUESTER_ID)).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("sessionService.completeSession", () => {
  it("throws 403 when the caller is not a participant", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession({ status: "ACCEPTED" }) as never);
    await expect(sessionService.completeSession(SESSION_ID, OUTSIDER_ID)).rejects.toMatchObject({ statusCode: 403 });
  });

  it("throws 409 when the session is not ACCEPTED", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession({ status: "PENDING" }) as never);
    await expect(sessionService.completeSession(SESSION_ID, REQUESTER_ID)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("allows either participant to mark an accepted session complete", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession({ status: "ACCEPTED" }) as never);
    mockSessionRepo.updateStatus.mockResolvedValue(makeSession({ status: "COMPLETED" }) as never);

    const result = await sessionService.completeSession(SESSION_ID, RECEIVER_ID);
    expect(result.status).toBe("COMPLETED");
  });
});
