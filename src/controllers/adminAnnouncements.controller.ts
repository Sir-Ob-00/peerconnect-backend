import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { announcementsService } from "../services/announcements.service";

export const adminAnnouncementsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const result = await announcementsService.list(search, status, page, limit);
    const data = {
      data: result.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.message,
        targetAudience: item.target,
        targetValue: item.targetId,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        createdBy: item.createdBy,
      })),
      pagination: result.pagination,
    };
    sendSuccess(res, { message: "Announcements retrieved.", data });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const announcement = await announcementsService.getById(id);
    if (!announcement) throw ApiError.notFound("Announcement not found");
    const data = {
      id: announcement.id,
      title: announcement.title,
      content: announcement.message,
      targetAudience: announcement.target,
      targetValue: announcement.targetId,
      status: announcement.status,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      createdBy: announcement.createdBy,
    };
    sendSuccess(res, { message: "Announcement retrieved.", data });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const createdById = (req as any).user?.id;
    const { content, ...rest } = req.body;
    const announcement = await announcementsService.create({ ...rest, message: content, createdById });
    const data = {
      id: announcement.id,
      title: announcement.title,
      content: announcement.message,
      targetAudience: announcement.target,
      targetValue: announcement.targetId,
      status: announcement.status,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      createdBy: announcement.createdBy,
    };
    sendSuccess(res, { statusCode: 201, message: "Announcement created.", data });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { content, ...rest } = req.body;
    const announcement = await announcementsService.update(id, { ...rest, message: content });
    const data = {
      id: announcement.id,
      title: announcement.title,
      content: announcement.message,
      targetAudience: announcement.target,
      targetValue: announcement.targetId,
      status: announcement.status,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      createdBy: announcement.createdBy,
    };
    sendSuccess(res, { message: "Announcement updated.", data });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await announcementsService.delete(id);
    sendSuccess(res, { message: "Announcement deleted." });
  }),
};
