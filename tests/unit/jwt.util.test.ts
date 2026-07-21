import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "../../src/utils/jwt.util";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const TOKEN_ID = "22222222-2222-2222-2222-222222222222";

describe("jwt.util", () => {
  it("signs and verifies an access token", () => {
    const token = signAccessToken({ userId: USER_ID, role: "STUDENT" as never });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe(USER_ID);
    expect(payload.role).toBe("STUDENT");
    expect(payload.type).toBe("access");
  });

  it("signs and verifies a refresh token", () => {
    const token = signRefreshToken({ userId: USER_ID, tokenId: TOKEN_ID });
    const payload = verifyRefreshToken(token);
    expect(payload.sub).toBe(USER_ID);
    expect(payload.jti).toBe(TOKEN_ID);
    expect(payload.type).toBe("refresh");
  });

  it("throws on a malformed token", () => {
    expect(() => verifyAccessToken("not-a-real-token")).toThrow();
  });

  it("throws when an access token is verified with the refresh-token secret", () => {
    const token = signAccessToken({ userId: USER_ID, role: "STUDENT" as never });
    expect(() => verifyRefreshToken(token)).toThrow();
  });

  it("throws when a refresh token is verified with the access-token secret", () => {
    const token = signRefreshToken({ userId: USER_ID, tokenId: TOKEN_ID });
    expect(() => verifyAccessToken(token)).toThrow();
  });
});
