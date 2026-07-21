import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { sessionRepository } from "../repositories/session.repository";
import { ApiError } from "../utils/ApiError";
import type { AdminSessionsQuery } from "../validators/admin.validator";

export const adminSessionsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as AdminSessionsQuery;
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const { items, totalItems } = await sessionRepository.findMany({
      status: query.status,
      requesterId: query.requesterId,
      receiverId: query.receiverId,
      skill: query.skill,
      skip,
      take: limit,
    });

    sendSuccess(res, {
      message: "Sessions retrieved.",
      data: {
        data: items.map((s) => ({
          id: s.id,
          skill: s.skill,
          message: s.message,
          status: s.status,
          scheduledDate: s.scheduledDate,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          requester: {
            id: s.requester.id,
            firstName: s.requester.firstName,
            lastName: s.requester.lastName,
            profileImage: s.requester.profileImage,
            email: s.requester.email,
          },
          receiver: {
            id: s.receiver.id,
            firstName: s.receiver.firstName,
            lastName: s.receiver.lastName,
            profileImage: s.receiver.profileImage,
            email: s.receiver.email,
          },
        })),
        pagination: {
          page,
          limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
        },
      },
    });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const session = await sessionRepository.findById(id);
    if (!session) throw ApiError.notFound("Session not found");

    sendSuccess(res, {
      message: "Session retrieved.",
      data: {
        id: session.id,
        skill: session.skill,
        message: session.message,
        status: session.status,
        scheduledDate: session.scheduledDate,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        requester: {
          id: session.requester.id,
          firstName: session.requester.firstName,
          lastName: session.requester.lastName,
          profileImage: session.requester.profileImage,
          email: session.requester.email,
        },
        receiver: {
          id: session.receiver.id,
          firstName: session.receiver.firstName,
          lastName: session.receiver.lastName,
          profileImage: session.receiver.profileImage,
          email: session.receiver.email,
        },
      },
    });
  }),
};
