import { Router } from "express";
import { adminAnalyticsController } from "../../controllers/adminAnalytics.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminAnalyticsQuerySchema } from "../../validators/admin.validator";

export const adminAnalyticsRouter = Router();

adminAnalyticsRouter.get(
  "/analytics/overview",
  authenticate,
  requireAdmin,
  adminAnalyticsController.overview
);

adminAnalyticsRouter.get(
  "/analytics/users",
  authenticate,
  requireAdmin,
  validateRequest({ query: adminAnalyticsQuerySchema }),
  adminAnalyticsController.users
);

adminAnalyticsRouter.get(
  "/analytics/sessions",
  authenticate,
  requireAdmin,
  validateRequest({ query: adminAnalyticsQuerySchema }),
  adminAnalyticsController.sessions
);

adminAnalyticsRouter.get(
  "/analytics/engagement",
  authenticate,
  requireAdmin,
  adminAnalyticsController.engagement
);
