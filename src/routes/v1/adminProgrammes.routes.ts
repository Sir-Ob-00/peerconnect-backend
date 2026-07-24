import { Router } from "express";
import { adminProgrammesController } from "../../controllers/adminProgrammes.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminProgrammesQuerySchema, adminCreateProgrammeSchema } from "../../validators/admin.validator";
import { uuidParamSchema } from "../../validators/common.validator";

export const adminProgrammesRouter = Router();

adminProgrammesRouter.get(
  "/programmes",
  authenticate,
  requireAdmin,
  validateRequest({ query: adminProgrammesQuerySchema }),
  adminProgrammesController.list
);

adminProgrammesRouter.post(
  "/programmes",
  authenticate,
  requireAdmin,
  validateRequest({ body: adminCreateProgrammeSchema }),
  adminProgrammesController.create
);

adminProgrammesRouter.patch(
  "/programmes/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminProgrammesController.update
);

adminProgrammesRouter.delete(
  "/programmes/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminProgrammesController.deactivate
);
