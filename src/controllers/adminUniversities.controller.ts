import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { universitiesService } from "../services/universities.service";

export const adminUniversitiesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const search = req.query.search as string | undefined;
    const data = await universitiesService.list(search, page, limit);
    return sendSuccess(res, { message: "Universities retrieved.", data });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await universitiesService.create(req.body);
    return sendSuccess(res, { statusCode: 201, message: "University created.", data });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await universitiesService.update(id, req.body);
    return sendSuccess(res, { message: "University updated.", data });
  }),

  deactivate: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await universitiesService.deactivate(id);
    return sendSuccess(res, { message: "University deactivated." });
  }),
};
