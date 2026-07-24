import { Router } from "express";
import { adminLevelsController } from "../../controllers/adminLevels.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminLevelsQuerySchema, adminCreateLevelSchema, adminUpdateLevelSchema, levelReorderSchema } from "../../validators/admin.validator";
import { uuidParamSchema } from "../../validators/common.validator";

export const adminLevelsRouter = Router();

adminLevelsRouter.get(
  "/levels",
  authenticate,
  requireAdmin,
  validateRequest({ query: adminLevelsQuerySchema }),
  adminLevelsController.list
);

adminLevelsRouter.post(
  "/levels",
  authenticate,
  requireAdmin,
  validateRequest({ body: adminCreateLevelSchema }),
  adminLevelsController.create
);

adminLevelsRouter.patch(
  "/levels/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema, body: adminUpdateLevelSchema }),
  adminLevelsController.update
);

adminLevelsRouter.delete(
  "/levels/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminLevelsController.deactivate
);

adminLevelsRouter.patch(
  "/levels/reorder",
  authenticate,
  requireAdmin,
  validateRequest({ body: levelReorderSchema }),
  adminLevelsController.reorder
);
