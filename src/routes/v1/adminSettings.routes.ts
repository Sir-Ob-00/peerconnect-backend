import { Router } from "express";
import { z } from "zod";
import { adminSettingsController } from "../../controllers/adminSettings.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminSettingsQuerySchema, adminUpdateSettingSchema } from "../../validators/admin.validator";

export const adminSettingsRouter = Router();

adminSettingsRouter.get(
  "/settings",
  authenticate,
  requireAdmin,
  validateRequest({ query: adminSettingsQuerySchema }),
  adminSettingsController.list
);

const settingsKeyParamSchema = z.object({ key: z.string() });

adminSettingsRouter.get(
  "/settings/:key",
  authenticate,
  requireAdmin,
  validateRequest({ params: settingsKeyParamSchema }),
  adminSettingsController.getByKey
);

adminSettingsRouter.patch(
  "/settings/:key",
  authenticate,
  requireAdmin,
  validateRequest({ params: settingsKeyParamSchema, body: adminUpdateSettingSchema }),
  adminSettingsController.createOrUpdate
);

adminSettingsRouter.delete(
  "/settings/:key",
  authenticate,
  requireAdmin,
  validateRequest({ params: settingsKeyParamSchema }),
  adminSettingsController.delete
);

adminSettingsRouter.post(
  "/settings/initialize",
  authenticate,
  requireAdmin,
  adminSettingsController.initializeDefaults
);
