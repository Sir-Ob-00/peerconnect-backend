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

jest.mock("../../src/repositories/user.repository", () => ({
  userRepository: {
    findActiveById: jest.fn(),
  },
}));

// Mocked at the service level — chat.service's use of this is a pure side
// effect (fire a CHAT_MESSAGE notification); its own logic is covered by
// notification.service.test.ts.
jest.mock("../../src/services/notification.service", () => ({
  notificationService: {
    createNotification: jest.fn(),
  },
}));

import { chatService } from "../../src/services/chat.service";
import { conversationRepository } from "../../src/repositories/conversation.repository";
import { messageRepository } from "../../src/repositories/message.repository";
import { userRepository } from "../../src/repositories/user.repository";

const mockConversationRepo = conversationRepository as jest.Mocked<typeof conversationRepository>;
const mockMessageRepo = messageRepository as jest.Mocked<typeof messageRepository>;
const mockUserRepo = userRepository as jest.Mocked<typeof userRepository>;

const USER_A = "11111111-1111-1111-1111-111111111111";
const USER_B = "22222222-2222-2222-2222-222222222222";
const OUTSIDER = "33333333-3333-3333-3333-333333333333";
const CONVERSATION_ID = "conv-1";

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
  return { id, firstName: "Ama", lastName: "Mensah", profileImage: null };
}

function makeConversation(overrides: Partial<Record<string, unknown>> = {}) {
  const { userOneId, userTwoId } = conversationRepository.canonicalPair(USER_A, USER_B);
  return {
    id: CONVERSATION_ID,
    userOneId,
    userTwoId,
    userOne: makeParticipant(userOneId),
    userTwo: makeParticipant(userTwoId),
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

describe("chatService.getOrCreateConversation", () => {
  it("rejects starting a conversation with yourself", async () => {
    await expect(chatService.getOrCreateConversation(USER_A, USER_A)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("returns the existing conversation without creating a new one", async () => {
    mockConversationRepo.findBetweenUsers.mockResolvedValue(makeConversation() as never);

    const result = await chatService.getOrCreateConversation(USER_A, USER_B);

    expect(result.isNew).toBe(false);
    expect(mockConversationRepo.create).not.toHaveBeenCalled();
  });

  it("throws 404 when the other user doesn't exist", async () => {
    mockConversationRepo.findBetweenUsers.mockResolvedValue(null);
    mockUserRepo.findActiveById.mockResolvedValue(null);

    await expect(chatService.getOrCreateConversation(USER_A, USER_B)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("creates a new conversation when none exists and the other user is valid", async () => {
    mockConversationRepo.findBetweenUsers.mockResolvedValue(null);
    mockUserRepo.findActiveById.mockResolvedValue(makeUser(USER_B) as never);
    mockConversationRepo.create.mockResolvedValue(makeConversation() as never);

    const result = await chatService.getOrCreateConversation(USER_A, USER_B);

    expect(result.isNew).toBe(true);
    expect(mockConversationRepo.create).toHaveBeenCalledWith(USER_A, USER_B);
  });
});

describe("chatService.sendMessage", () => {
  it("throws 404 when conversationId doesn't exist", async () => {
    mockConversationRepo.findById.mockResolvedValue(null);
    await expect(
      chatService.sendMessage(USER_A, { conversationId: CONVERSATION_ID, content: "hi" })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 403 when the sender is not a participant of the given conversation", async () => {
    mockConversationRepo.findById.mockResolvedValue(makeConversation() as never);
    await expect(
      chatService.sendMessage(OUTSIDER, { conversationId: CONVERSATION_ID, content: "hi" })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("throws 400 when neither content nor imageUrl is provided", async () => {
    mockConversationRepo.findById.mockResolvedValue(makeConversation() as never);
    await expect(chatService.sendMessage(USER_A, { conversationId: CONVERSATION_ID })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("sends a message into an existing conversation and identifies the receiver", async () => {
    mockConversationRepo.findById.mockResolvedValue(makeConversation() as never);
    mockMessageRepo.create.mockResolvedValue(makeMessage() as never);

    const result = await chatService.sendMessage(USER_A, { conversationId: CONVERSATION_ID, content: "Hello!" });

    expect(result.receiverId).toBe(USER_B);
    expect(result.senderId).toBe(USER_A);
    expect(result.isNewConversation).toBe(false);
    expect(result.message.content).toBe("Hello!");
  });

  it("starts a new conversation via receiverId when none exists yet", async () => {
    mockConversationRepo.findBetweenUsers.mockResolvedValue(null);
    mockUserRepo.findActiveById.mockResolvedValue(makeUser(USER_B) as never);
    mockConversationRepo.create.mockResolvedValue(makeConversation() as never);
    mockMessageRepo.create.mockResolvedValue(makeMessage() as never);

    const result = await chatService.sendMessage(USER_A, { receiverId: USER_B, content: "Hi there" });

    expect(result.isNewConversation).toBe(true);
    expect(result.receiverId).toBe(USER_B);
  });

  it("allows an image-only message with no text content", async () => {
    mockConversationRepo.findById.mockResolvedValue(makeConversation() as never);
    mockMessageRepo.create.mockResolvedValue(makeMessage({ content: null, imageUrl: "https://img" }) as never);

    const result = await chatService.sendMessage(USER_A, {
      conversationId: CONVERSATION_ID,
      imageUrl: "https://img",
    });

    expect(result.message.imageUrl).toBe("https://img");
  });
});

describe("chatService.listMessages", () => {
  it("throws 404 when the conversation doesn't exist", async () => {
    mockConversationRepo.findById.mockResolvedValue(null);
    await expect(chatService.listMessages(CONVERSATION_ID, USER_A, 1, 20)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("throws 403 for a non-participant", async () => {
    mockConversationRepo.findById.mockResolvedValue(makeConversation() as never);
    await expect(chatService.listMessages(CONVERSATION_ID, OUTSIDER, 1, 20)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("returns paginated messages for a participant", async () => {
    mockConversationRepo.findById.mockResolvedValue(makeConversation() as never);
    mockMessageRepo.listByConversation.mockResolvedValue({ items: [makeMessage()], totalItems: 1 });

    const result = await chatService.listMessages(CONVERSATION_ID, USER_A, 1, 20);

    expect(result.messages).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 1, limit: 20, totalPages: 1, totalItems: 1 });
  });
});

describe("chatService.listConversations", () => {
  it("maps conversations with unread counts, sorted by most recent activity", async () => {
    const older = makeConversation({
      id: "conv-older",
      createdAt: new Date("2026-01-01"),
      messages: [makeMessage({ createdAt: new Date("2026-01-02") })],
    });
    const newer = makeConversation({
      id: "conv-newer",
      createdAt: new Date("2026-06-01"),
      messages: [makeMessage({ createdAt: new Date("2026-06-02") })],
    });
    mockConversationRepo.listForUser.mockResolvedValue([older, newer] as never);
    mockMessageRepo.countUnread.mockResolvedValue(0);

    const result = await chatService.listConversations(USER_A);

    expect(result[0].id).toBe("conv-newer");
    expect(result[1].id).toBe("conv-older");
  });

  it("includes the unread count per conversation", async () => {
    mockConversationRepo.listForUser.mockResolvedValue([makeConversation({ messages: [] })] as never);
    mockMessageRepo.countUnread.mockResolvedValue(3);

    const result = await chatService.listConversations(USER_A);

    expect(result[0].unreadCount).toBe(3);
    expect(result[0].lastMessage).toBeNull();
  });
});

describe("chatService.markConversationRead", () => {
  it("throws 404 when the conversation doesn't exist", async () => {
    mockConversationRepo.findById.mockResolvedValue(null);
    await expect(chatService.markConversationRead(CONVERSATION_ID, USER_A)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("throws 403 for a non-participant", async () => {
    mockConversationRepo.findById.mockResolvedValue(makeConversation() as never);
    await expect(chatService.markConversationRead(CONVERSATION_ID, OUTSIDER)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("marks messages read and identifies the other participant to notify", async () => {
    mockConversationRepo.findById.mockResolvedValue(makeConversation() as never);
    mockMessageRepo.markConversationRead.mockResolvedValue({ count: 2 });

    const result = await chatService.markConversationRead(CONVERSATION_ID, USER_A);

    expect(mockMessageRepo.markConversationRead).toHaveBeenCalledWith(CONVERSATION_ID, USER_A);
    expect(result.otherParticipantId).toBe(USER_B);
    expect(result.updatedCount).toBe(2);
  });
});
