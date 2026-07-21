import { hashPassword } from "../../src/utils/password.util";
import { hashToken } from "../../src/utils/token.util";
import { signRefreshToken } from "../../src/utils/jwt.util";

// Explicit factory mocks — the real repository modules (which construct a
// PrismaClient at import time) are never loaded, so these tests don't need
// a generated Prisma client or a real database at all.
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

import { authService } from "../../src/services/auth.service";
import { userRepository } from "../../src/repositories/user.repository";
import { refreshTokenRepository } from "../../src/repositories/refreshToken.repository";
import { passwordResetTokenRepository } from "../../src/repositories/passwordResetToken.repository";

const mockUserRepo = userRepository as jest.Mocked<typeof userRepository>;
const mockRefreshRepo = refreshTokenRepository as jest.Mocked<typeof refreshTokenRepository>;
const mockResetRepo = passwordResetTokenRepository as jest.Mocked<typeof passwordResetTokenRepository>;

function makeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    firstName: "Ama",
    lastName: "Mensah",
    email: "ama.mensah@st.university.edu.gh",
    password: "hashed-password",
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

describe("authService.register", () => {
  it("rejects registration when the email is already taken", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(makeUser() as never);

    await expect(
      authService.register({
        firstName: "Ama",
        lastName: "Mensah",
        email: "ama.mensah@st.university.edu.gh",
        password: "StrongPass1!",
        confirmPassword: "StrongPass1!",
      })
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(mockUserRepo.create).not.toHaveBeenCalled();
  });

  it("creates the user with a hashed password and returns tokens without leaking the password", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue(makeUser() as never);

    const result = await authService.register({
      firstName: "Ama",
      lastName: "Mensah",
      email: "ama.mensah@st.university.edu.gh",
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
    });

    expect(mockUserRepo.create).toHaveBeenCalledTimes(1);
    const createArg = mockUserRepo.create.mock.calls[0][0] as { password: string };
    expect(createArg.password).not.toBe("StrongPass1!"); // stored hashed, not plaintext

    expect(result.user).not.toHaveProperty("password");
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(mockRefreshRepo.create).toHaveBeenCalledTimes(1);
  });
});

describe("authService.login", () => {
  it("rejects an unknown email with a generic message", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(authService.login({ email: "nobody@uni.edu.gh", password: "whatever" })).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid email or password.",
    });
  });

  it("rejects an incorrect password with the same generic message", async () => {
    const hashed = await hashPassword("CorrectPass1!");
    mockUserRepo.findByEmail.mockResolvedValue(makeUser({ password: hashed }) as never);

    await expect(
      authService.login({ email: "ama.mensah@st.university.edu.gh", password: "WrongPass1!" })
    ).rejects.toMatchObject({ statusCode: 401, message: "Invalid email or password." });
  });

  it("rejects a suspended account after verifying the password", async () => {
    const hashed = await hashPassword("CorrectPass1!");
    mockUserRepo.findByEmail.mockResolvedValue(
      makeUser({ password: hashed, accountStatus: "SUSPENDED" }) as never
    );

    await expect(
      authService.login({ email: "ama.mensah@st.university.edu.gh", password: "CorrectPass1!" })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("rejects an inactive account", async () => {
    const hashed = await hashPassword("CorrectPass1!");
    mockUserRepo.findByEmail.mockResolvedValue(makeUser({ password: hashed, accountStatus: "INACTIVE" }) as never);

    await expect(
      authService.login({ email: "ama.mensah@st.university.edu.gh", password: "CorrectPass1!" })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("rejects a soft-deleted account", async () => {
    const hashed = await hashPassword("CorrectPass1!");
    mockUserRepo.findByEmail.mockResolvedValue(makeUser({ password: hashed, deletedAt: new Date() }) as never);

    await expect(
      authService.login({ email: "ama.mensah@st.university.edu.gh", password: "CorrectPass1!" })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("logs in successfully with correct credentials on an active account", async () => {
    const hashed = await hashPassword("CorrectPass1!");
    mockUserRepo.findByEmail.mockResolvedValue(makeUser({ password: hashed }) as never);

    const result = await authService.login({
      email: "ama.mensah@st.university.edu.gh",
      password: "CorrectPass1!",
    });

    expect(result.user.email).toBe("ama.mensah@st.university.edu.gh");
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
  });
});

describe("authService.refresh", () => {
  it("rejects a syntactically invalid refresh token", async () => {
    await expect(authService.refresh("garbage-token")).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects a valid JWT that has no matching (or a revoked) stored token", async () => {
    const tokenId = "22222222-2222-2222-2222-222222222222";
    const userId = "11111111-1111-1111-1111-111111111111";
    const token = signRefreshToken({ userId, tokenId });

    mockRefreshRepo.findById.mockResolvedValue(null);

    await expect(authService.refresh(token)).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rotates a valid refresh token: revokes the old one and issues a new pair", async () => {
    const tokenId = "22222222-2222-2222-2222-222222222222";
    const userId = "11111111-1111-1111-1111-111111111111";
    const token = signRefreshToken({ userId, tokenId });

    mockRefreshRepo.findById.mockResolvedValue({
      id: tokenId,
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      revokedAt: null,
      createdAt: new Date(),
    } as never);
    mockUserRepo.findById.mockResolvedValue(makeUser({ id: userId }) as never);

    const result = await authService.refresh(token);

    expect(mockRefreshRepo.revoke).toHaveBeenCalledWith(tokenId);
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.refreshToken).not.toBe(token);
  });
});

describe("authService.forgotPassword", () => {
  it("returns no token when the email doesn't belong to an active user (no enumeration)", async () => {
    mockUserRepo.findActiveByEmail.mockResolvedValue(null);

    const result = await authService.forgotPassword({ email: "nobody@uni.edu.gh" });

    expect(result).toEqual({});
    expect(mockResetRepo.create).not.toHaveBeenCalled();
  });

  it("generates and returns a reset token for an existing active user", async () => {
    mockUserRepo.findActiveByEmail.mockResolvedValue(makeUser() as never);
    mockResetRepo.create.mockResolvedValue({} as never);

    const result = await authService.forgotPassword({ email: "ama.mensah@st.university.edu.gh" });

    expect(result.resetToken).toEqual(expect.any(String));
    expect(mockResetRepo.invalidateAllForUser).toHaveBeenCalled();
    expect(mockResetRepo.create).toHaveBeenCalledTimes(1);

    // The token stored in the DB must be a hash of the returned plaintext, never the plaintext itself.
    const createArg = mockResetRepo.create.mock.calls[0][0] as { tokenHash: string };
    expect(createArg.tokenHash).toBe(hashToken(result.resetToken as string));
  });
});

describe("authService.resetPassword", () => {
  it("rejects an unknown/invalid token", async () => {
    mockResetRepo.findByTokenHash.mockResolvedValue(null);

    await expect(
      authService.resetPassword({ token: "bad-token", password: "NewStrongPass1!", confirmPassword: "NewStrongPass1!" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects an expired token", async () => {
    mockResetRepo.findByTokenHash.mockResolvedValue({
      id: "reset-1",
      userId: "11111111-1111-1111-1111-111111111111",
      tokenHash: "hash",
      expiresAt: new Date(Date.now() - 1000),
      usedAt: null,
      createdAt: new Date(),
    } as never);

    await expect(
      authService.resetPassword({ token: "expired-token", password: "NewStrongPass1!", confirmPassword: "NewStrongPass1!" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects an already-used token", async () => {
    mockResetRepo.findByTokenHash.mockResolvedValue({
      id: "reset-1",
      userId: "11111111-1111-1111-1111-111111111111",
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
      createdAt: new Date(),
    } as never);

    await expect(
      authService.resetPassword({ token: "used-token", password: "NewStrongPass1!", confirmPassword: "NewStrongPass1!" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("updates the password, marks the token used, and revokes all sessions on success", async () => {
    const userId = "11111111-1111-1111-1111-111111111111";
    mockResetRepo.findByTokenHash.mockResolvedValue({
      id: "reset-1",
      userId,
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      createdAt: new Date(),
    } as never);
    mockUserRepo.findById.mockResolvedValue(makeUser({ id: userId }) as never);

    await authService.resetPassword({
      token: "valid-token",
      password: "NewStrongPass1!",
      confirmPassword: "NewStrongPass1!",
    });

    expect(mockUserRepo.update).toHaveBeenCalledWith(userId, expect.objectContaining({ password: expect.any(String) }));
    expect(mockResetRepo.markUsed).toHaveBeenCalledWith("reset-1");
    expect(mockRefreshRepo.revokeAllForUser).toHaveBeenCalledWith(userId);
  });
});

describe("authService.changePassword", () => {
  it("rejects when the user no longer exists", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(null);

    await expect(
      authService.changePassword("missing-id", { currentPassword: "a", newPassword: "NewStrongPass1!" })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("rejects an incorrect current password", async () => {
    const hashed = await hashPassword("ActualCurrentPass1!");
    mockUserRepo.findActiveById.mockResolvedValue(makeUser({ password: hashed }) as never);

    await expect(
      authService.changePassword("11111111-1111-1111-1111-111111111111", {
        currentPassword: "WrongCurrent1!",
        newPassword: "NewStrongPass1!",
      })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("updates the password and revokes all sessions on success", async () => {
    const userId = "11111111-1111-1111-1111-111111111111";
    const hashed = await hashPassword("ActualCurrentPass1!");
    mockUserRepo.findActiveById.mockResolvedValue(makeUser({ id: userId, password: hashed }) as never);

    await authService.changePassword(userId, {
      currentPassword: "ActualCurrentPass1!",
      newPassword: "NewStrongPass1!",
    });

    expect(mockUserRepo.update).toHaveBeenCalledWith(userId, expect.objectContaining({ password: expect.any(String) }));
    expect(mockRefreshRepo.revokeAllForUser).toHaveBeenCalledWith(userId);
  });
});

describe("authService.getMe", () => {
  it("throws 404 when the user doesn't exist", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(null);
    await expect(authService.getMe("missing-id")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("returns a public user without the password field", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(makeUser() as never);
    const result = await authService.getMe("11111111-1111-1111-1111-111111111111");
    expect(result).not.toHaveProperty("password");
    expect(result.email).toBe("ama.mensah@st.university.edu.gh");
  });
});
