import { ApiError } from "../utils/ApiError";
import { settingRepository } from "../repositories/setting.repository";

export const settingsService = {
  async listSettings(filters: { category?: string; isPublic?: boolean }, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const result = await settingRepository.findMany({
      ...filters,
      skip,
      take: limit,
    });

    return {
      data: result.items,
      pagination: { page, limit, totalItems: result.totalItems, totalPages: Math.ceil(result.totalItems / limit) },
    };
  },

  async getSettingByKey(key: string) {
    const setting = await settingRepository.findByKey(key);
    if (!setting) throw ApiError.notFound("Setting not found.");
    return setting;
  },

  async createOrUpdateSetting(key: string, value: string, type: string, category: string, description?: string, isPublic?: boolean) {
    return settingRepository.upsert(key, {
      value,
      type: type as any,
      category: category as any,
      description: description ?? undefined,
      isPublic: isPublic ?? false,
    });
  },

  async deleteSetting(key: string) {
    const setting = await settingRepository.findByKey(key);
    if (!setting) throw ApiError.notFound("Setting not found.");
    return settingRepository.delete(key);
  },

  async initializeDefaults() {
    const defaults = [
      { key: "MAINTENANCE_MODE", value: "false", type: "BOOLEAN", category: "GENERAL", description: "Enable maintenance mode" },
      { key: "MAX_SESSION_REQUESTS_PER_DAY", value: "5", type: "NUMBER", category: "FEATURES", description: "Max session requests per day per user" },
      { key: "REVIEW_ELIGIBLE_STATUSES", value: '["COMPLETED"]', type: "JSON", category: "GENERAL", description: "Session statuses eligible for review" },
    ];

    const created = [];
    for (const def of defaults) {
      const existing = await settingRepository.findByKey(def.key);
      if (!existing) {
        const s = await settingRepository.create(def as any);
        created.push(s);
      }
    }

    return created;
  },
};
