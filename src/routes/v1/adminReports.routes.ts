import { Router } from "express";
import { adminReportsController } from "../../controllers/adminReports.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminReportsQuerySchema, adminCreateReportSchema, adminUpdateReportSchema } from "../../validators/admin.validator";
import { uuidParamSchema } from "../../validators/common.validator";

export const adminReportsRouter = Router();

adminReportsRouter.get(
  "/reports",
  authenticate,
  requireAdmin,
  validateRequest({ query: adminReportsQuerySchema }),
  adminReportsController.list
);

adminReportsRouter.get(
  "/reports/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminReportsController.getById
);

adminReportsRouter.post(
  "/reports",
  authenticate,
  requireAdmin,
  validateRequest({ body: adminCreateReportSchema }),
  adminReportsController.create
);

adminReportsRouter.patch(
  "/reports/:id/status",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema, body: adminUpdateReportSchema }),
  adminReportsController.updateStatus
);

adminReportsRouter.delete(
  "/reports/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminReportsController.delete
);
