import { Router } from "express";
import { z } from "zod";
import { adminNotificationsController } from "../../controllers/adminNotifications.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminNotificationsQuerySchema, notificationBroadcastSchema } from "../../validators/admin.validator";
import { uuidParamSchema } from "../../validators/common.validator";

const adminDirectNotificationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(2),
  message: z.string().min(2),
  type: z.string().optional(),
});

export const adminNotificationsRouter = Router();

adminNotificationsRouter.get(
  "/notifications",
  authenticate,
  requireAdmin,
  validateRequest({ query: adminNotificationsQuerySchema }),
  adminNotificationsController.list
);

adminNotificationsRouter.post(
  "/notifications",
  authenticate,
  requireAdmin,
  validateRequest({ body: adminDirectNotificationSchema }),
  adminNotificationsController.create
);

adminNotificationsRouter.post(
  "/notifications/broadcast",
  authenticate,
  requireAdmin,
  validateRequest({ body: notificationBroadcastSchema }),
  adminNotificationsController.broadcast
);

adminNotificationsRouter.delete(
  "/notifications/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminNotificationsController.delete
);
