import { Router } from "express";
import { adminSessionsController } from "../../controllers/adminSessions.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminSessionsQuerySchema } from "../../validators/admin.validator";
import { uuidParamSchema } from "../../validators/common.validator";

export const adminSessionsRouter = Router();

adminSessionsRouter.get(
  "/sessions",
  authenticate,
  requireAdmin,
  validateRequest({ query: adminSessionsQuerySchema }),
  adminSessionsController.list
);

adminSessionsRouter.get(
  "/sessions/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminSessionsController.getById
);
