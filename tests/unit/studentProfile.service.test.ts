jest.mock("../../src/repositories/user.repository", () => ({
  userRepository: {
    findActiveById: jest.fn(),
  },
}));

jest.mock("../../src/repositories/studentProfile.repository", () => ({
  studentProfileRepository: {
    findByUserId: jest.fn(),
    getOrCreateByUserId: jest.fn(),
    updateByUserId: jest.fn(),
    setProfilePhoto: jest.fn(),
  },
}));

jest.mock("../../src/utils/cloudinaryUpload.util", () => ({
  uploadImageBuffer: jest.fn(),
}));

import { studentProfileService } from "../../src/services/studentProfile.service";
import { userRepository } from "../../src/repositories/user.repository";
import { studentProfileRepository } from "../../src/repositories/studentProfile.repository";
import { uploadImageBuffer } from "../../src/utils/cloudinaryUpload.util";

const mockUserRepo = userRepository as jest.Mocked<typeof userRepository>;
const mockProfileRepo = studentProfileRepository as jest.Mocked<typeof studentProfileRepository>;
const mockUpload = uploadImageBuffer as jest.MockedFunction<typeof uploadImageBuffer>;

const USER_ID = "11111111-1111-1111-1111-111111111111";

function makeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: USER_ID,
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

function makeProfile(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "profile-1",
    userId: USER_ID,
    department: null,
    level: null,
    skills: [],
    learningInterests: [],
    bio: null,
    availability: null,
    profilePhoto: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("studentProfileService.getMyProfile", () => {
  it("throws 404 when the user doesn't exist", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(null);
    await expect(studentProfileService.getMyProfile(USER_ID)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("returns user + an auto-created profile", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(makeUser() as never);
    mockProfileRepo.getOrCreateByUserId.mockResolvedValue(makeProfile() as never);

    const result = await studentProfileService.getMyProfile(USER_ID);

    expect(mockProfileRepo.getOrCreateByUserId).toHaveBeenCalledWith(USER_ID);
    expect(result.user.email).toBe("ama.mensah@st.university.edu.gh");
    expect(result.profile.skills).toEqual([]);
  });
});

describe("studentProfileService.updateMyProfile", () => {
  it("throws 404 when the user doesn't exist", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(null);
    await expect(studentProfileService.updateMyProfile(USER_ID, { bio: "hi" })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("passes the update straight through to the repository and returns the mapped view", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(makeUser() as never);
    mockProfileRepo.updateByUserId.mockResolvedValue(
      makeProfile({ department: "Computer Science", skills: ["React Native"] }) as never
    );

    const result = await studentProfileService.updateMyProfile(USER_ID, {
      department: "Computer Science",
      skills: ["React Native"],
    });

    expect(mockProfileRepo.updateByUserId).toHaveBeenCalledWith(USER_ID, {
      department: "Computer Science",
      skills: ["React Native"],
    });
    expect(result.department).toBe("Computer Science");
    expect(result.skills).toEqual(["React Native"]);
  });
});

describe("studentProfileService.uploadProfilePhoto", () => {
  const file = { buffer: Buffer.from("fake-image-bytes") } as Express.Multer.File;

  it("throws 404 when the user doesn't exist", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(null);
    await expect(studentProfileService.uploadProfilePhoto(USER_ID, file)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("throws 400 when no file is provided", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(makeUser() as never);
    await expect(studentProfileService.uploadProfilePhoto(USER_ID, undefined)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("uploads to Cloudinary with a per-user public id and saves the returned URL", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(makeUser() as never);
    mockUpload.mockResolvedValue({ secureUrl: "https://res.cloudinary.com/demo/image/upload/user_1.jpg", publicId: `user_${USER_ID}` });
    mockProfileRepo.setProfilePhoto.mockResolvedValue(
      makeProfile({ profilePhoto: "https://res.cloudinary.com/demo/image/upload/user_1.jpg" }) as never
    );

    const result = await studentProfileService.uploadProfilePhoto(USER_ID, file);

    expect(mockUpload).toHaveBeenCalledWith(file.buffer, `user_${USER_ID}`);
    expect(mockProfileRepo.setProfilePhoto).toHaveBeenCalledWith(
      USER_ID,
      "https://res.cloudinary.com/demo/image/upload/user_1.jpg"
    );
    expect(result.profilePhoto).toBe("https://res.cloudinary.com/demo/image/upload/user_1.jpg");
  });
});

describe("studentProfileService.getPublicProfile", () => {
  it("throws 404 when the user doesn't exist", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(null);
    await expect(studentProfileService.getPublicProfile(USER_ID)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("returns a well-formed empty profile when the user has none yet, without creating one", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(makeUser() as never);
    mockProfileRepo.findByUserId.mockResolvedValue(null);

    const result = await studentProfileService.getPublicProfile(USER_ID);

    expect(result.skills).toEqual([]);
    expect(result.department).toBeNull();
    expect(mockProfileRepo.getOrCreateByUserId).not.toHaveBeenCalled();
  });

  it("excludes account-internal fields like email from the public view", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(makeUser() as never);
    mockProfileRepo.findByUserId.mockResolvedValue(makeProfile({ department: "Mathematics" }) as never);

    const result = await studentProfileService.getPublicProfile(USER_ID);

    expect(result).not.toHaveProperty("email");
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("accountStatus");
    expect(result.department).toBe("Mathematics");
    expect(result.firstName).toBe("Ama");
  });
});
