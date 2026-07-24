import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { adminsService } from "../services/admins.service";
import type { AdminAdminsQuery } from "../validators/admin.validator";

export const adminAdminsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as AdminAdminsQuery;
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const result = await adminsService.listAdmins({ search: query.search }, page, limit);
    sendSuccess(res, { message: "Admins retrieved.", data: result });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const admin = await adminsService.createAdmin(req.body);
    sendSuccess(res, { statusCode: 201, message: "Admin created.", data: admin });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const admin = await adminsService.updateAdmin(id, req.body);
    sendSuccess(res, { message: "Admin updated.", data: admin });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const admin = await adminsService.removeAdmin(id);
    sendSuccess(res, { message: "Admin removed.", data: admin });
  }),
};
