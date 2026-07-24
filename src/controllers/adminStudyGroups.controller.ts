import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { studyGroupsService } from "../services/studyGroups.service";
import type { AdminStudyGroupsQuery } from "../validators/admin.validator";

export const adminStudyGroupsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as AdminStudyGroupsQuery;
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const result = await studyGroupsService.listAllGroups(query.search, page, limit);
    sendSuccess(res, { message: "Study groups retrieved.", data: result });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const group = await studyGroupsService.getGroupById(id);
    sendSuccess(res, { message: "Study group retrieved.", data: group });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const result = await studyGroupsService.deleteGroup(id);
    sendSuccess(res, { message: "Study group deleted.", data: result });
  }),

  members: asyncHandler(async (req: Request, res: Response) => {
    const { chatRoomId } = req.params as { chatRoomId: string };
    const members = await studyGroupsService.getGroupMembers(chatRoomId);
    sendSuccess(res, { message: "Members retrieved.", data: members });
  }),

  removeMember: asyncHandler(async (req: Request, res: Response) => {
    const { chatRoomId, userId } = req.params as { chatRoomId: string; userId: string };
    const result = await studyGroupsService.removeMember(chatRoomId, userId);
    sendSuccess(res, { message: "Member removed.", data: result });
  }),

  messages: asyncHandler(async (req: Request, res: Response) => {
    const { chatRoomId } = req.params as { chatRoomId: string };
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "20", 10);

    const result = await studyGroupsService.getGroupMessages(chatRoomId, page, limit);
    sendSuccess(res, { message: "Messages retrieved.", data: result });
  }),
};
