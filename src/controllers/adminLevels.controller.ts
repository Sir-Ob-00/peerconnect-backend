import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { levelsService } from "../services/levels.service";

export const adminLevelsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const search = req.query.search as string | undefined;
    const     data = await levelsService.list(search, page, limit);
    return sendSuccess(res, { message: "Levels retrieved.", data });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const     data = await levelsService.create(req.body);
    return sendSuccess(res, { statusCode: 201, message: "Level created.", data });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const     data = await levelsService.update(id, req.body);
    return sendSuccess(res, { message: "Level updated.", data });
  }),

  deactivate: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await levelsService.deactivate(id);
    return sendSuccess(res, { message: "Level deactivated." });
  }),

  reorder: asyncHandler(async (req: Request, res: Response) => {
    const result = await levelsService.reorder(req.body.items);
    return sendSuccess(res, { message: "Levels reordered.", data: result });
  }),
};
