import type { RefreshToken } from "@prisma/client";
import { prisma } from "../config/database";

interface CreateRefreshTokenInput {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export const refreshTokenRepository = {
  create(data: CreateRefreshTokenInput): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data });
  },

  findById(id: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({ where: { id } });
  },

  revoke(id: string): Promise<RefreshToken> {
    return prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  },

  /** Revokes every active refresh token for a user — used on logout-all-devices and password changes. */
  revokeAllForUser(userId: string): Promise<{ count: number }> {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  deleteExpired(): Promise<{ count: number }> {
    return prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  },
};
