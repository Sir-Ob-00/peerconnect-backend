import { onlineUsersRegistry } from "../../src/sockets/onlineUsers.registry";

const USER_A = "user-a";
const USER_B = "user-b";

beforeEach(() => {
  onlineUsersRegistry.clear();
});

describe("onlineUsersRegistry", () => {
  it("reports a user offline before any connection", () => {
    expect(onlineUsersRegistry.isOnline("nobody")).toBe(false);
  });

  it("marks a user online on their first connection and reports it as a new online event", () => {
    const justCameOnline = onlineUsersRegistry.addConnection(USER_A, "socket-1");
    expect(justCameOnline).toBe(true);
    expect(onlineUsersRegistry.isOnline(USER_A)).toBe(true);
  });

  it("a second connection for the same user is not reported as a new online event", () => {
    onlineUsersRegistry.addConnection(USER_A, "socket-1");
    const justCameOnline = onlineUsersRegistry.addConnection(USER_A, "socket-2");
    expect(justCameOnline).toBe(false);
  });

  it("stays online after disconnecting one of several devices", () => {
    onlineUsersRegistry.addConnection(USER_A, "socket-1");
    onlineUsersRegistry.addConnection(USER_A, "socket-2");

    const wentOffline = onlineUsersRegistry.removeConnection(USER_A, "socket-1");

    expect(wentOffline).toBe(false);
    expect(onlineUsersRegistry.isOnline(USER_A)).toBe(true);
  });

  it("goes offline only once the last connection disconnects", () => {
    onlineUsersRegistry.addConnection(USER_A, "socket-1");
    onlineUsersRegistry.addConnection(USER_A, "socket-2");
    onlineUsersRegistry.removeConnection(USER_A, "socket-1");

    const wentOffline = onlineUsersRegistry.removeConnection(USER_A, "socket-2");

    expect(wentOffline).toBe(true);
    expect(onlineUsersRegistry.isOnline(USER_A)).toBe(false);
  });

  it("removing an already-untracked connection is a safe no-op", () => {
    expect(onlineUsersRegistry.removeConnection("ghost-user", "ghost-socket")).toBe(false);
  });

  it("tracks multiple distinct users independently", () => {
    onlineUsersRegistry.addConnection(USER_A, "socket-1");
    onlineUsersRegistry.addConnection(USER_B, "socket-2");

    expect(onlineUsersRegistry.getOnlineUserIds().sort()).toEqual([USER_A, USER_B].sort());

    onlineUsersRegistry.removeConnection(USER_A, "socket-1");
    expect(onlineUsersRegistry.isOnline(USER_A)).toBe(false);
    expect(onlineUsersRegistry.isOnline(USER_B)).toBe(true);
  });
});
