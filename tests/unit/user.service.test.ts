jest.mock("../../src/repositories/user.repository", () => ({
  userRepository: {
    findActiveById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  },
}));

jest.mock("../../src/repositories/refreshToken.repository", () => ({
  refreshTokenRepository: {
    revokeAllForUser: jest.fn(),
  },
}));

import { userService } from "../../src/services/user.service";
import { userRepository } from "../../src/repositories/user.repository";
import { refreshTokenRepository } from "../../src/repositories/refreshToken.repository";

const mockUserRepo = userRepository as jest.Mocked<typeof userRepository>;
const mockRefreshRepo = refreshTokenRepository as jest.Mocked<typeof refreshTokenRepository>;

function makeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "11111111-1111-1111-1111-111111111111",
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

describe("userService.updateMe", () => {
  it("throws 404 when the user doesn't exist", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(null);
    await expect(userService.updateMe("missing-id", { firstName: "New" })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("updates only the provided fields and never touches email", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(makeUser() as never);
    mockUserRepo.update.mockResolvedValue(makeUser({ firstName: "Akosua" }) as never);

    const result = await userService.updateMe("11111111-1111-1111-1111-111111111111", { firstName: "Akosua" });

    expect(mockUserRepo.update).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111", {
      firstName: "Akosua",
    });
    expect(result.firstName).toBe("Akosua");
    expect(result).not.toHaveProperty("email", undefined); // email untouched, still present
  });
});

describe("userService.deleteMe", () => {
  it("throws 404 when the user doesn't exist", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(null);
    await expect(userService.deleteMe("missing-id")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("soft-deletes the user and revokes all their sessions", async () => {
    const userId = "11111111-1111-1111-1111-111111111111";
    mockUserRepo.findActiveById.mockResolvedValue(makeUser({ id: userId }) as never);

    await userService.deleteMe(userId);

    expect(mockUserRepo.softDelete).toHaveBeenCalledWith(userId);
    expect(mockRefreshRepo.revokeAllForUser).toHaveBeenCalledWith(userId);
  });
});
