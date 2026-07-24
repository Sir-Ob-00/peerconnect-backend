import { Router } from "express";
import { adminAnnouncementsController } from "../../controllers/adminAnnouncements.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminAnnouncementsQuerySchema, adminCreateAnnouncementSchema } from "../../validators/admin.validator";
import { uuidParamSchema } from "../../validators/common.validator";

export const adminAnnouncementsRouter = Router();

adminAnnouncementsRouter.get(
  "/announcements",
  authenticate,
  requireAdmin,
  validateRequest({ query: adminAnnouncementsQuerySchema }),
  adminAnnouncementsController.list
);

adminAnnouncementsRouter.get(
  "/announcements/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminAnnouncementsController.getById
);

adminAnnouncementsRouter.post(
  "/announcements",
  authenticate,
  requireAdmin,
  validateRequest({ body: adminCreateAnnouncementSchema }),
  adminAnnouncementsController.create
);

adminAnnouncementsRouter.patch(
  "/announcements/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema, body: adminCreateAnnouncementSchema.partial() }),
  adminAnnouncementsController.update
);

adminAnnouncementsRouter.delete(
  "/announcements/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminAnnouncementsController.delete
);
