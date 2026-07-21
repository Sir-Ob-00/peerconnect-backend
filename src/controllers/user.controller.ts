import type { Request, Response } from "express";
import { userService } from "../services/user.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import type { UpdateMeInput } from "../validators/user.validator";

export const userController = {
  updateMe: asyncHandler(async (req: Request<unknown, unknown, UpdateMeInput>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const user = await userService.updateMe(req.user.id, req.body);
    sendSuccess(res, { message: "Account updated successfully.", data: user });
  }),

  deleteMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    await userService.deleteMe(req.user.id);
    sendSuccess(res, { message: "Account deleted successfully." });
  }),
};
