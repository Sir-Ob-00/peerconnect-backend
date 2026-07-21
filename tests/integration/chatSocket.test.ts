import http from "http";
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";

jest.mock("../../src/repositories/user.repository", () => ({
  userRepository: {
    findActiveById: jest.fn(),
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

jest.mock("../../src/repositories/notification.repository", () => ({
  notificationRepository: {
    create: jest.fn(),
    findById: jest.fn(),
    listByUser: jest.fn(),
    countUnread: jest.fn(),
    markRead: jest.fn(),
  },
}));

import { createSocketServer } from "../../src/sockets";
import { conversationRepository } from "../../src/repositories/conversation.repository";
import { messageRepository } from "../../src/repositories/message.repository";
import { notificationRepository } from "../../src/repositories/notification.repository";
import { signAccessToken } from "../../src/utils/jwt.util";

const mockConversationRepo = conversationRepository as jest.Mocked<typeof conversationRepository>;
const mockMessageRepo = messageRepository as jest.Mocked<typeof messageRepository>;
const mockNotificationRepo = notificationRepository as jest.Mocked<typeof notificationRepository>;

const USER_A = "11111111-1111-1111-1111-111111111111";
const USER_B = "22222222-2222-2222-2222-222222222222";
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

/** Resolves with the first emission of `event` on `socket`, or rejects after `timeoutMs`. */
function waitForEvent<T = unknown>(socket: ClientSocket, event: string, timeoutMs = 2000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for "${event}"`)), timeoutMs);
    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

describe("Chat Socket.IO server", () => {
  let httpServer: http.Server;
  let io: ReturnType<typeof createSocketServer>;
  let port: number;

  beforeEach(() => {
    // chatService.sendMessage always creates a CHAT_MESSAGE notification as
    // a side effect (Phase 8) — give it a default resolved value so tests
    // that don't care about notifications specifically don't have to.
    mockNotificationRepo.create.mockResolvedValue({
      id: "notif-1",
      userId: "unused",
      title: "New message",
      message: "unused",
      type: "CHAT_MESSAGE",
      isRead: false,
      createdAt: new Date(),
    } as never);
  });

  beforeAll(async () => {
    httpServer = http.createServer();
    io = createSocketServer(httpServer);
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const address = httpServer.address();
        port = typeof address === "object" && address ? address.port : 0;
        resolve();
      });
    });
  });

  afterAll(async () => {
    // io.close() also closes the underlying httpServer — closing both
    // separately (or in the wrong order) is what leaves handles open.
    await new Promise<void>((resolve) => io.close(() => resolve()));
  });

  function connectClient(userId: string): ClientSocket {
    return ioClient(`http://localhost:${port}`, {
      auth: { token: tokenFor(userId) },
      transports: ["websocket"],
      forceNew: true,
    });
  }

  it("rejects a connection with no token", async () => {
    const client = ioClient(`http://localhost:${port}`, { transports: ["websocket"], forceNew: true });
    const err = await waitForEvent<Error>(client, "connect_error");
    expect(err.message).toMatch(/authentication required/i);
    client.close();
  });

  it("rejects a connection with an invalid token", async () => {
    const client = ioClient(`http://localhost:${port}`, {
      auth: { token: "not-a-real-token" },
      transports: ["websocket"],
      forceNew: true,
    });
    const err = await waitForEvent<Error>(client, "connect_error");
    expect(err.message).toMatch(/invalid access token/i);
    client.close();
  });

  it("accepts a connection with a valid token", async () => {
    const client = connectClient(USER_A);
    await waitForEvent(client, "connect");
    expect(client.connected).toBe(true);
    client.close();
  });

  it("delivers message:receive to both the sender and the receiver", async () => {
    mockConversationRepo.findById.mockResolvedValue(makeConversation() as never);
    mockMessageRepo.create.mockResolvedValue(makeMessage() as never);

    const clientA = connectClient(USER_A);
    const clientB = connectClient(USER_B);
    await Promise.all([waitForEvent(clientA, "connect"), waitForEvent(clientB, "connect")]);

    const receivedByB = waitForEvent<{ message: { content: string }; conversationId: string }>(
      clientB,
      "message:receive"
    );
    const receivedByA = waitForEvent<{ message: { content: string } }>(clientA, "message:receive");

    clientA.emit("message:send", { conversationId: CONVERSATION_ID, content: "Hello!" });

    const [payloadB, payloadA] = await Promise.all([receivedByB, receivedByA]);
    expect(payloadB.message.content).toBe("Hello!");
    expect(payloadB.conversationId).toBe(CONVERSATION_ID);
    expect(payloadA.message.content).toBe("Hello!");

    clientA.close();
    clientB.close();
  });

  it("tells the sender the message was delivered when the receiver is online", async () => {
    mockConversationRepo.findById.mockResolvedValue(makeConversation() as never);
    mockMessageRepo.create.mockResolvedValue(makeMessage() as never);

    const clientA = connectClient(USER_A);
    const clientB = connectClient(USER_B);
    await Promise.all([waitForEvent(clientA, "connect"), waitForEvent(clientB, "connect")]);

    const delivered = waitForEvent<{ conversationId: string; messageId: string }>(clientA, "message:delivered");
    clientA.emit("message:send", { conversationId: CONVERSATION_ID, content: "Hi" });

    const payload = await delivered;
    expect(payload.conversationId).toBe(CONVERSATION_ID);

    clientA.close();
    clientB.close();
  });

  it("relays typing:start and typing:stop to the other participant only", async () => {
    mockConversationRepo.findById.mockResolvedValue(makeConversation() as never);

    const clientA = connectClient(USER_A);
    const clientB = connectClient(USER_B);
    await Promise.all([waitForEvent(clientA, "connect"), waitForEvent(clientB, "connect")]);

    const typingStartOnB = waitForEvent<{ conversationId: string; userId: string }>(clientB, "typing:start");
    clientA.emit("typing:start", { conversationId: CONVERSATION_ID });
    const startPayload = await typingStartOnB;
    expect(startPayload.userId).toBe(USER_A);

    const typingStopOnB = waitForEvent<{ conversationId: string; userId: string }>(clientB, "typing:stop");
    clientA.emit("typing:stop", { conversationId: CONVERSATION_ID });
    const stopPayload = await typingStopOnB;
    expect(stopPayload.userId).toBe(USER_A);

    clientA.close();
    clientB.close();
  });

  it("notifies the original sender when their messages are read", async () => {
    mockConversationRepo.findById.mockResolvedValue(makeConversation() as never);
    mockMessageRepo.markConversationRead.mockResolvedValue({ count: 2 });

    const clientA = connectClient(USER_A);
    const clientB = connectClient(USER_B);
    await Promise.all([waitForEvent(clientA, "connect"), waitForEvent(clientB, "connect")]);

    const readOnA = waitForEvent<{ conversationId: string; readByUserId: string; updatedCount: number }>(
      clientA,
      "message:read"
    );
    clientB.emit("message:read", { conversationId: CONVERSATION_ID });

    const payload = await readOnA;
    expect(payload.readByUserId).toBe(USER_B);
    expect(payload.updatedCount).toBe(2);

    clientA.close();
    clientB.close();
  });

  it("emits an error event (not a crash) for an unauthorized message:send", async () => {
    mockConversationRepo.findById.mockResolvedValue(makeConversation() as never);

    // A third user who isn't a participant in CONVERSATION_ID.
    const OUTSIDER = "99999999-9999-9999-9999-999999999999";
    const clientOutsider = connectClient(OUTSIDER);
    await waitForEvent(clientOutsider, "connect");

    const errorEvent = waitForEvent<{ message: string }>(clientOutsider, "error");
    clientOutsider.emit("message:send", { conversationId: CONVERSATION_ID, content: "sneaky" });

    const payload = await errorEvent;
    expect(payload.message).toMatch(/not a participant/i);

    clientOutsider.close();
  });

  it("emits an error event for an invalid message:send payload", async () => {
    const clientA = connectClient(USER_A);
    await waitForEvent(clientA, "connect");

    const errorEvent = waitForEvent<{ message: string }>(clientA, "error");
    clientA.emit("message:send", { conversationId: CONVERSATION_ID }); // no content, no imageUrl

    const payload = await errorEvent;
    expect(payload.message).toBeTruthy();

    clientA.close();
  });
});
