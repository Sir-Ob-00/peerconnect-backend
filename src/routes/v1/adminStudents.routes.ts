import { Router } from "express";
import { adminStudentsController } from "../../controllers/adminStudents.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminStudentsQuerySchema, adminSuspendStudentSchema } from "../../validators/admin.validator";
import { uuidParamSchema } from "../../validators/common.validator";

export const adminStudentsRouter = Router();

adminStudentsRouter.get(
  "/students",
  authenticate,
  requireAdmin,
  validateRequest({ query: adminStudentsQuerySchema }),
  adminStudentsController.list
);

adminStudentsRouter.get(
  "/students/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminStudentsController.getById
);

adminStudentsRouter.patch(
  "/students/:id/suspend",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema, body: adminSuspendStudentSchema }),
  adminStudentsController.suspend
);

adminStudentsRouter.delete(
  "/students/:id",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminStudentsController.remove
);
