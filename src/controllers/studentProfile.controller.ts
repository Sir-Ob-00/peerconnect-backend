import type { Request, Response } from "express";
import { studentProfileService } from "../services/studentProfile.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import type { UpdateStudentProfileInput } from "../validators/studentProfile.validator";
import type { UuidParamInput } from "../validators/common.validator";

export const studentProfileController = {
  getMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const result = await studentProfileService.getMyProfile(req.user.id);
    sendSuccess(res, { message: "Profile retrieved successfully.", data: result });
  }),

  updateMe: asyncHandler(async (req: Request<unknown, unknown, UpdateStudentProfileInput>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const profile = await studentProfileService.updateMyProfile(req.user.id, req.body);
    sendSuccess(res, { message: "Profile updated successfully.", data: profile });
  }),

  uploadPhoto: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const profile = await studentProfileService.uploadProfilePhoto(req.user.id, req.file);
    sendSuccess(res, { message: "Profile photo uploaded successfully.", data: profile });
  }),

  getById: asyncHandler(async (req: Request<UuidParamInput>, res: Response) => {
    const profile = await studentProfileService.getPublicProfile(req.params.id);
    sendSuccess(res, { message: "Student profile retrieved successfully.", data: profile });
  }),

  getStats: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized("Authentication required.");
    const stats = await studentProfileService.getStats(req.user.id);
    sendSuccess(res, { message: "Profile stats retrieved.", data: stats });
  }),
};
