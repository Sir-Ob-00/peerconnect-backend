import { hashPassword } from "../utils/password.util";
import { ApiError } from "../utils/ApiError";
import { userRepository } from "../repositories/user.repository";

export const adminsService = {
  async listAdmins(filters: { search?: string }, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const result = await userRepository.findMany({
      role: "ADMIN",
      search: filters.search,
      skip,
      take: limit,
    });

    return {
      data: result.items,
      pagination: { page, limit, totalItems: result.totalItems, totalPages: Math.ceil(result.totalItems / limit) },
    };
  },

  async createAdmin(data: { firstName: string; lastName: string; email: string; password: string; role?: string }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw ApiError.conflict("Email is already registered.");

    const hashedPassword = await hashPassword(data.password);

    return userRepository.create({
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim().toLowerCase(),
      password: hashedPassword,
      role: (data.role || "ADMIN") as any,
      accountStatus: "ACTIVE",
      isEmailVerified: true,
    });
  },

  async updateAdmin(id: string, data: { firstName?: string; lastName?: string; email?: string; role?: string }) {
    const user = await userRepository.findById(id);
    if (!user || user.role !== "ADMIN") throw ApiError.notFound("Admin not found.");

    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName.trim();
    if (data.lastName !== undefined) updateData.lastName = data.lastName.trim();
    if (data.email !== undefined && data.email !== user.email) {
      const existing = await userRepository.findByEmail(data.email);
      if (existing) throw ApiError.conflict("Email is already in use.");
      updateData.email = data.email.trim().toLowerCase();
    }
    if (data.role !== undefined) updateData.role = data.role as any;

    return userRepository.update(id, updateData);
  },

  async removeAdmin(id: string) {
    const user = await userRepository.findById(id);
    if (!user || user.role !== "ADMIN") throw ApiError.notFound("Admin not found.");

    return userRepository.softDelete(id);
  },
};
