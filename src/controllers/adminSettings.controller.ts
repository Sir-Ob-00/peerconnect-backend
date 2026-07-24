import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { settingsService } from "../services/settings.service";
import type { AdminSettingsQuery } from "../validators/admin.validator";

export const adminSettingsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as AdminSettingsQuery;
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const result = await settingsService.listSettings(
      { category: query.category },
      page,
      limit
    );
    sendSuccess(res, { message: "Settings retrieved.", data: result });
  }),

  getByKey: asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params as { key: string };
    const setting = await settingsService.getSettingByKey(key);
    sendSuccess(res, { message: "Setting retrieved.", data: setting });
  }),

  createOrUpdate: asyncHandler(async (req: Request, res: Response) => {
    const { key, value, type, category, description, isPublic } = req.body;
    const setting = await settingsService.createOrUpdateSetting(key, value, type, category, description, isPublic);
    sendSuccess(res, { message: "Setting saved.", data: setting });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params as { key: string };
    const setting = await settingsService.deleteSetting(key);
    sendSuccess(res, { message: "Setting deleted.", data: setting });
  }),

  initializeDefaults: asyncHandler(async (_req: Request, res: Response) => {
    const settings = await settingsService.initializeDefaults();
    sendSuccess(res, { statusCode: 201, message: "Default settings initialized.", data: settings });
  }),
};
