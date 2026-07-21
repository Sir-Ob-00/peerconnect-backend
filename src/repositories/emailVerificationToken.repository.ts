import type { EmailVerificationToken } from "@prisma/client";
import { prisma } from "../config/database";

interface CreateEmailVerificationTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export const emailVerificationTokenRepository = {
  create(data: CreateEmailVerificationTokenInput): Promise<EmailVerificationToken> {
    return prisma.emailVerificationToken.create({ data });
  },

  findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    return prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
  },

  findLatestForUser(userId: string): Promise<EmailVerificationToken | null> {
    return prisma.emailVerificationToken.findFirst({
      where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
  },

  incrementAttempts(id: string): Promise<EmailVerificationToken> {
    return prisma.emailVerificationToken.update({ where: { id }, data: { attempts: { increment: 1 } } });
  },

  markUsed(id: string): Promise<EmailVerificationToken> {
    return prisma.emailVerificationToken.update({ where: { id }, data: { usedAt: new Date() } });
  },

  invalidateAllForUser(userId: string): Promise<{ count: number }> {
    return prisma.emailVerificationToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
  },
};