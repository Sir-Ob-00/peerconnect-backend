import { Router } from "express";
import { adminDepartmentsController } from "../../controllers/adminDepartments.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminDepartmentsQuerySchema, adminCreateDepartmentSchema } from "../../validators/admin.validator";
import { uuidParamSchema } from "../../validators/common.validator";

export const adminDepartmentsRouter = Router();

adminDepartmentsRouter.get(
  "/departments",
  authenticate,
  requireAdmin,
  validateRequest({ query: adminDepartmentsQuerySchema }),
  adminDepartmentsController.list
);

adminDepartmentsRouter.post(
  "/departments",
  authenticate,
  requireAdmin,
  validateRequest({ body: adminCreateDepartmentSchema }),
  adminDepartmentsController.create
);

adminDepartmentsRouter.patch(
  "/departments/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminDepartmentsController.update
);

adminDepartmentsRouter.delete(
  "/departments/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminDepartmentsController.deactivate
);
