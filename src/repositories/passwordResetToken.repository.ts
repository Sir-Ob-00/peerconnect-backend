import type { PasswordResetToken } from "@prisma/client";
import { prisma } from "../config/database";

interface CreateResetTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export const passwordResetTokenRepository = {
  create(data: CreateResetTokenInput): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({ data });
  },

  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  },

  markUsed(id: string): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  },

  /** Invalidates any previously-issued, still-usable reset tokens for a user before issuing a new one. */
  invalidateAllForUser(userId: string): Promise<{ count: number }> {
    return prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  },
};
