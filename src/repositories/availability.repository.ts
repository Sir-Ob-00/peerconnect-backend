import type { Availability, Prisma } from "@prisma/client";
import { prisma } from "../config/database";

export type AvailabilityInput = {
  userId: string;
  dayOfWeek: Prisma.AvailabilityCreateInput["dayOfWeek"];
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
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });
  },

  update(id: string, data: Partial<AvailabilityInput>): Promise<Availability> {
    const updateData: Prisma.AvailabilityUpdateInput = {};
    if (data.dayOfWeek) updateData.dayOfWeek = data.dayOfWeek;
    if (data.startTime) updateData.startTime = data.startTime;
    if (data.endTime) updateData.endTime = data.endTime;

    return prisma.availability.update({
      where: { id },
      data: updateData,
    });
  },

  remove(id: string): Promise<Availability> {
    return prisma.availability.delete({ where: { id } });
  },
};
