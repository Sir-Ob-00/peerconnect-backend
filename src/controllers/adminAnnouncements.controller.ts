import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { announcementsService } from "../services/announcements.service";

export const adminAnnouncementsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const target = req.query.target as string | undefined;
    const isActive = req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined;
    const data = await announcementsService.list(target, isActive, page, limit);
    sendSuccess(res, { message: "Announcements retrieved.", data });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const announcement = await announcementsService.getById(id);
    if (!announcement) throw ApiError.notFound("Announcement not found");
    sendSuccess(res, { message: "Announcement retrieved.", data: announcement });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const createdById = (req as any).user?.id;
    const data = await announcementsService.create({ ...req.body, createdById });
    sendSuccess(res, { statusCode: 201, message: "Announcement created.", data });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await announcementsService.update(id, req.body);
    sendSuccess(res, { message: "Announcement updated.", data });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await announcementsService.delete(id);
    sendSuccess(res, { message: "Announcement deleted." });
  }),
};
