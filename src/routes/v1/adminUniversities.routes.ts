import { Router } from "express";
import { adminUniversitiesController } from "../../controllers/adminUniversities.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminUniversitiesQuerySchema, adminCreateUniversitySchema } from "../../validators/admin.validator";
import { uuidParamSchema } from "../../validators/common.validator";

export const adminUniversitiesRouter = Router();

adminUniversitiesRouter.get(
  "/universities",
  authenticate,
  requireAdmin,
  validateRequest({ query: adminUniversitiesQuerySchema }),
  adminUniversitiesController.list
);

adminUniversitiesRouter.post(
  "/universities",
  authenticate,
  requireAdmin,
  validateRequest({ body: adminCreateUniversitySchema }),
  adminUniversitiesController.create
);

adminUniversitiesRouter.patch(
  "/universities/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminUniversitiesController.update
);

adminUniversitiesRouter.delete(
  "/universities/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminUniversitiesController.deactivate
);
