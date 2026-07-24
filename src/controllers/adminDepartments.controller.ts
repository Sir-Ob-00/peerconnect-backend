import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { departmentsService } from "../services/departments.service";

export const adminDepartmentsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const universityId = req.query.universityId as string | undefined;
    const search = req.query.search as string | undefined;
    const data = await departmentsService.list(universityId, search, page, limit);
    return sendSuccess(res, { message: "Departments retrieved.", data });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await departmentsService.create(req.body);
    return sendSuccess(res, { statusCode: 201, message: "Department created.", data });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await departmentsService.update(id, req.body);
    return sendSuccess(res, { message: "Department updated.", data });
  }),

  deactivate: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await departmentsService.deactivate(id);
    return sendSuccess(res, { message: "Department deactivated." });
  }),
};
