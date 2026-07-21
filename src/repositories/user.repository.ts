import type { Prisma, User } from "@prisma/client";
import { prisma } from "../config/database";

/**
 * All direct Prisma access for User lives here. Services depend on this
 * interface, not on `prisma` directly, so business logic stays testable
 * (mock this repository) and swapping persistence details later doesn't
 * ripple through the service layer.
 */
export const userRepository = {
  create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  },

  /** Includes soft-deleted users deliberately — callers decide what "active" means for their use case. */
  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },

  findByVerificationStatus(status: string): Promise<User[]> {
    return prisma.user.findMany({ where: { verificationStatus: status } });
  },

  /** Convenience for auth flows: only ever operate on non-deleted users. */
  findActiveById(id: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { id, deletedAt: null } });
  },

  findActiveByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { email: email.toLowerCase(), deletedAt: null } });
  },

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  },

  softDelete(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), accountStatus: "INACTIVE" },
    });
  },
};
