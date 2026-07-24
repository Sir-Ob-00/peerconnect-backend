import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { programmesService } from "../services/programmes.service";

export const adminProgrammesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const universityId = req.query.universityId as string | undefined;
    const departmentId = req.query.departmentId as string | undefined;
    const search = req.query.search as string | undefined;
    const data = await programmesService.list(universityId, departmentId, search, page, limit);
    return sendSuccess(res, { message: "Programmes retrieved.", data });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await programmesService.create(req.body);
    return sendSuccess(res, { statusCode: 201, message: "Programme created.", data });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await programmesService.update(id, req.body);
    return sendSuccess(res, { message: "Programme updated.", data });
  }),

  deactivate: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await programmesService.deactivate(id);
    return sendSuccess(res, { message: "Programme deactivated." });
  }),
};
