import type { Availability } from "@prisma/client";
import { prisma } from "../config/database";

export type AvailabilityInput = {
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export const availabilityRepository = {
  findByUser(userId: string): Promise<Availability[]> {
    return prisma.availability.findMany({
      where: { userId },
      orderBy: { dayOfWeek: "asc" },
    });
  },

  findById(id: string): Promise<Availability | null> {
    return prisma.availability.findUnique({ where: { id } });
  },

  create(data: AvailabilityInput): Promise<Availability> {
    return prisma.availability.create({
      data: {
        userId: data.userId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime.replace(/\0/g, ""),
        endTime: data.endTime.replace(/\0/g, ""),
      },
    });
  },

  update(id: string, data: Partial<AvailabilityInput>): Promise<Availability> {
    const updateData: any = {};
    if (data.dayOfWeek !== undefined) updateData.dayOfWeek = data.dayOfWeek;
    if (data.startTime !== undefined) updateData.startTime = data.startTime.replace(/\0/g, "");
    if (data.endTime !== undefined) updateData.endTime = data.endTime.replace(/\0/g, "");

    return prisma.availability.update({
      where: { id },
      data: updateData,
    });
  },

  remove(id: string): Promise<Availability> {
    return prisma.availability.delete({ where: { id } });
  },
};
