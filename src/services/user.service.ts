import { userRepository } from "../repositories/user.repository";
import { refreshTokenRepository } from "../repositories/refreshToken.repository";
import { toPublicUser, type PublicUser } from "../dtos/user.dto";
import { ApiError } from "../utils/ApiError";
import type { UpdateMeInput } from "../validators/user.validator";

export const userService = {
  async updateMe(userId: string, input: UpdateMeInput): Promise<PublicUser> {
    const user = await userRepository.findActiveById(userId);
    if (!user) {
      throw ApiError.notFound("User not found.");
    }

    // Email is intentionally excluded — not editable at this stage (see spec).
    const updated = await userRepository.update(userId, {
      ...(input.firstName !== undefined && { firstName: input.firstName }),
      ...(input.lastName !== undefined && { lastName: input.lastName }),
      ...(input.profileImage !== undefined && { profileImage: input.profileImage }),
    });

    return toPublicUser(updated);
  },

  async deleteMe(userId: string): Promise<void> {
    const user = await userRepository.findActiveById(userId);
    if (!user) {
      throw ApiError.notFound("User not found.");
    }

    await userRepository.softDelete(userId);
    // A deleted account can't keep using previously-issued sessions.
    await refreshTokenRepository.revokeAllForUser(userId);
  },
};
