jest.mock("../../src/repositories/notification.repository", () => ({
  notificationRepository: {
    create: jest.fn(),
    findById: jest.fn(),
    listByUser: jest.fn(),
    countUnread: jest.fn(),
    markRead: jest.fn(),
  },
}));

jest.mock("../../src/sockets/socketEmitter", () => ({
  emitToUser: jest.fn(),
}));

import { notificationService } from "../../src/services/notification.service";
import { notificationRepository } from "../../src/repositories/notification.repository";
import { emitToUser } from "../../src/sockets/socketEmitter";
import { NOTIFICATION_CONSTANTS } from "../../src/constants/notification.constants";

const mockRepo = notificationRepository as jest.Mocked<typeof notificationRepository>;
const mockEmitToUser = emitToUser as jest.MockedFunction<typeof emitToUser>;

const USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "22222222-2222-2222-2222-222222222222";

function makeNotification(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "notif-1",
    userId: USER_ID,
    title: "New session request",
    message: "Ama Mensah requested a session with you on React Native.",
    type: "SESSION_REQUEST",
    isRead: false,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("notificationService.createNotification", () => {
  it("persists the notification via the repository", async () => {
    mockRepo.create.mockResolvedValue(makeNotification() as never);

    await notificationService.createNotification({
      userId: USER_ID,
      title: "New session request",
      message: "Ama Mensah requested a session with you on React Native.",
      type: "SESSION_REQUEST",
    });

    expect(mockRepo.create).toHaveBeenCalledWith({
      userId: USER_ID,
      title: "New session request",
      message: "Ama Mensah requested a session with you on React Native.",
      type: "SESSION_REQUEST",
    });
  });

  it("pushes the notification over Socket.IO to the target user's personal room", async () => {
    mockRepo.create.mockResolvedValue(makeNotification() as never);

    const result = await notificationService.createNotification({
      userId: USER_ID,
      title: "New session request",
      message: "hi",
      type: "SESSION_REQUEST",
    });

    expect(mockEmitToUser).toHaveBeenCalledWith(USER_ID, NOTIFICATION_CONSTANTS.SOCKET_EVENT, result);
  });

  it("returns the created notification mapped to its view shape", async () => {
    mockRepo.create.mockResolvedValue(makeNotification({ id: "notif-42" }) as never);

    const result = await notificationService.createNotification({
      userId: USER_ID,
      title: "t",
      message: "m",
      type: "CHAT_MESSAGE",
    });

    expect(result.id).toBe("notif-42");
  });
});

describe("notificationService.listForUser", () => {
  it("returns notifications, pagination, and an independent unread count", async () => {
    mockRepo.listByUser.mockResolvedValue({ items: [makeNotification()], totalItems: 5 });
    mockRepo.countUnread.mockResolvedValue(3);

    const result = await notificationService.listForUser(USER_ID, 1, 20);

    expect(result.notifications).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 1, limit: 20, totalPages: 1, totalItems: 5 });
    expect(result.unreadCount).toBe(3);
  });
});

describe("notificationService.markRead", () => {
  it("throws 404 when the notification doesn't exist", async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(notificationService.markRead("missing", USER_ID)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 403 when the notification belongs to someone else", async () => {
    mockRepo.findById.mockResolvedValue(makeNotification({ userId: OTHER_USER_ID }) as never);
    await expect(notificationService.markRead("notif-1", USER_ID)).rejects.toMatchObject({ statusCode: 403 });
  });

  it("is idempotent — marking an already-read notification succeeds without a repository write", async () => {
    mockRepo.findById.mockResolvedValue(makeNotification({ isRead: true }) as never);

    const result = await notificationService.markRead("notif-1", USER_ID);

    expect(result.isRead).toBe(true);
    expect(mockRepo.markRead).not.toHaveBeenCalled();
  });

  it("marks an unread notification as read", async () => {
    mockRepo.findById.mockResolvedValue(makeNotification({ isRead: false }) as never);
    mockRepo.markRead.mockResolvedValue(makeNotification({ isRead: true }) as never);

    const result = await notificationService.markRead("notif-1", USER_ID);

    expect(mockRepo.markRead).toHaveBeenCalledWith("notif-1");
    expect(result.isRead).toBe(true);
  });
});
