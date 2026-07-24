import { Router } from "express";
import { z } from "zod";
import { adminStudyGroupsController } from "../../controllers/adminStudyGroups.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminStudyGroupsQuerySchema } from "../../validators/admin.validator";
import { uuidParamSchema, chatRoomParamSchema } from "../../validators/common.validator";

const chatRoomMemberParamSchema = z.object({
  chatRoomId: z.string().uuid("Must be a valid UUID"),
  userId: z.string().uuid("Must be a valid UUID"),
});

export const adminStudyGroupsRouter = Router();

adminStudyGroupsRouter.get(
  "/study-groups",
  authenticate,
  requireAdmin,
  validateRequest({ query: adminStudyGroupsQuerySchema }),
  adminStudyGroupsController.list
);

adminStudyGroupsRouter.get(
  "/study-groups/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminStudyGroupsController.getById
);

adminStudyGroupsRouter.delete(
  "/study-groups/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminStudyGroupsController.delete
);

adminStudyGroupsRouter.get(
  "/study-groups/:chatRoomId/members",
  authenticate,
  requireAdmin,
  validateRequest({ params: chatRoomParamSchema }),
  adminStudyGroupsController.members
);

adminStudyGroupsRouter.delete(
  "/study-groups/:chatRoomId/members/:userId",
  authenticate,
  requireAdmin,
  validateRequest({ params: chatRoomMemberParamSchema }),
  adminStudyGroupsController.removeMember
);

adminStudyGroupsRouter.get(
  "/study-groups/:chatRoomId/messages",
  authenticate,
  requireAdmin,
  validateRequest({ params: chatRoomParamSchema }),
  adminStudyGroupsController.messages
);
