import { emitToUser, setSocketServer } from "../../src/sockets/socketEmitter";

describe("socketEmitter", () => {
  it("emitToUser is a safe no-op before the socket server is initialized", () => {
    // No setSocketServer call in this test — module state starts uninitialized
    // in a fresh test file, but since it's a singleton shared across the
    // whole test run order isn't guaranteed. What matters is it never throws.
    expect(() => emitToUser("user-1", "notification:new", { hello: "world" })).not.toThrow();
  });

  it("forwards to the target user's personal room once a server is set", () => {
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    const fakeServer = { to } as never;

    setSocketServer(fakeServer);
    emitToUser("user-42", "notification:new", { title: "Hi" });

    expect(to).toHaveBeenCalledWith("user:user-42");
    expect(emit).toHaveBeenCalledWith("notification:new", { title: "Hi" });
  });
});
