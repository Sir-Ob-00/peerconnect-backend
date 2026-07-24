import { prisma } from "../config/database";

export interface SettingResult {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const settingRepository = {
  async create(data: any): Promise<any> {
    return (prisma as any).setting.create({ data });
  },

  async findByKey(key: string): Promise<any> {
    return (prisma as any).setting.findUnique({ where: { key } });
  },

  async findMany(filters: any): Promise<{ items: SettingResult[]; totalItems: number }> {
    const where: any = {};
    if (filters.category) where.category = filters.category;
    if (filters.isPublic !== undefined) where.isPublic = filters.isPublic;

    const [items, totalItems] = await Promise.all([
      (prisma as any).setting.findMany({
        where,
        orderBy: { key: "asc" },
        skip: filters.skip ?? 0,
        take: filters.take ?? 10,
      }),
      (prisma as any).setting.count({ where }),
    ]);

    return { items: items as SettingResult[], totalItems };
  },

  async update(key: string, data: any): Promise<any> {
    return (prisma as any).setting.update({ where: { key }, data });
  },

  async upsert(key: string, data: any): Promise<any> {
    return (prisma as any).setting.upsert({
      where: { key },
      update: data,
      create: { key, ...data },
    });
  },

  async delete(key: string): Promise<any> {
    return (prisma as any).setting.delete({ where: { key } });
  },
};
