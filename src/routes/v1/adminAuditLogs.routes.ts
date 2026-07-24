import { Router } from "express";
import { adminAuditLogsController } from "../../controllers/adminAuditLogs.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminAuditLogsQuerySchema } from "../../validators/admin.validator";
import { uuidParamSchema } from "../../validators/common.validator";

export const adminAuditLogsRouter = Router();

adminAuditLogsRouter.get(
  "/audit-logs",
  authenticate,
  requireAdmin,
  validateRequest({ query: adminAuditLogsQuerySchema }),
  adminAuditLogsController.list
);

adminAuditLogsRouter.get(
  "/audit-logs/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminAuditLogsController.getById
);

adminAuditLogsRouter.get(
  "/audit-logs/stats",
  authenticate,
  requireAdmin,
  adminAuditLogsController.stats
);
