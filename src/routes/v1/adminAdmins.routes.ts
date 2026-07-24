import { Router } from "express";
import { adminAdminsController } from "../../controllers/adminAdmins.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminAdminsQuerySchema, adminCreateAdminSchema } from "../../validators/admin.validator";
import { uuidParamSchema } from "../../validators/common.validator";

export const adminAdminsRouter = Router();

adminAdminsRouter.get(
  "/admins",
  authenticate,
  requireAdmin,
  validateRequest({ query: adminAdminsQuerySchema }),
  adminAdminsController.list
);

adminAdminsRouter.post(
  "/admins",
  authenticate,
  requireAdmin,
  validateRequest({ body: adminCreateAdminSchema }),
  adminAdminsController.create
);

adminAdminsRouter.patch(
  "/admins/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminAdminsController.update
);

adminAdminsRouter.delete(
  "/admins/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminAdminsController.remove
);
