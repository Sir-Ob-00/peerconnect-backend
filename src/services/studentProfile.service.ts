import { userRepository } from "../repositories/user.repository";
import { studentProfileRepository } from "../repositories/studentProfile.repository";
import { uploadImageBuffer } from "../utils/cloudinaryUpload.util";
import { ApiError } from "../utils/ApiError";
import { toPublicUser, type PublicUser } from "../dtos/user.dto";
import {
  toPublicStudentProfile,
  toStudentProfileView,
  type PublicStudentProfile,
  type StudentProfileView,
} from "../dtos/studentProfile.dto";
import type { UpdateStudentProfileInput } from "../validators/studentProfile.validator";

export interface MyProfileResult {
  user: PublicUser;
  profile: StudentProfileView;
}

export const studentProfileService = {
  async getMyProfile(userId: string): Promise<MyProfileResult> {
    const user = await userRepository.findActiveById(userId);
    if (!user) {
      throw ApiError.notFound("User not found.");
    }

    const profile = await studentProfileRepository.getOrCreateByUserId(userId);
    return { user: toPublicUser(user), profile: toStudentProfileView(profile) };
  },

  async updateMyProfile(userId: string, input: UpdateStudentProfileInput): Promise<StudentProfileView> {
    const user = await userRepository.findActiveById(userId);
    if (!user) {
      throw ApiError.notFound("User not found.");
    }

    const updated = await studentProfileRepository.updateByUserId(userId, input);

    const requiredFieldsPresent =
      updated.department &&
      updated.level &&
      Array.isArray(updated.skills) && updated.skills.length > 0 &&
      updated.availability &&
      updated.bio;

    if (requiredFieldsPresent) {
      await userRepository.update(userId, {
        setupProgress: "id_verification_pending",
        verificationStatus: "id_verification_pending",
      } as any);
    }

    return toStudentProfileView(updated);
  },

  async uploadProfilePhoto(userId: string, file: Express.Multer.File | undefined): Promise<StudentProfileView> {
    const user = await userRepository.findActiveById(userId);
    if (!user) {
      throw ApiError.notFound("User not found.");
    }
    if (!file) {
      throw ApiError.badRequest('No image file provided. Attach one under the "photo" field.');
    }

    const uploaded = await uploadImageBuffer(file.buffer, `user_${userId}`);
    const updated = await studentProfileRepository.setProfilePhoto(userId, uploaded.secureUrl);
    return toStudentProfileView(updated);
  },

  async getPublicProfile(userId: string): Promise<PublicStudentProfile> {
    const user = await userRepository.findActiveById(userId);
    if (!user) {
      throw ApiError.notFound("Student profile not found.");
    }

    // No auto-create here — viewing someone else's profile must never have
    // a write side effect. A user with no profile yet just renders empty.
    const profile = await studentProfileRepository.findByUserId(userId);
    return toPublicStudentProfile(user, profile);
  },
};
