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

  async countByVerificationStatus(status: string): Promise<number> {
    return prisma.user.count({ where: { verificationStatus: status } });
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

  async findMany(filters: {
    search?: string;
    role?: string;
    verificationStatus?: string;
    accountStatus?: string;
    skip?: number;
    take?: number;
  }): Promise<{ items: User[]; totalItems: number }> {
    const where: Prisma.UserWhereInput = {};
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters.role) where.role = filters.role as any;
    if (filters.verificationStatus) where.verificationStatus = filters.verificationStatus;
    if (filters.accountStatus) where.accountStatus = filters.accountStatus as any;

    const [items, totalItems] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: filters.skip ?? 0,
        take: filters.take ?? 10,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);
    return { items, totalItems };
  },

  async count(filters?: { role?: string; deletedAt?: boolean; createdAt?: { gte?: Date; lt?: Date } }): Promise<number> {
    const where: Prisma.UserWhereInput = {};
    if (filters?.role) where.role = filters.role as any;
    if (filters?.deletedAt !== undefined) where.deletedAt = filters.deletedAt ? { not: null } : null;
    if (filters?.createdAt?.gte) where.createdAt = { gte: filters.createdAt.gte };
    if (filters?.createdAt?.lt) where.createdAt = { ...(where.createdAt as any), lt: filters.createdAt.lt };
    return prisma.user.count({ where });
  },
};
