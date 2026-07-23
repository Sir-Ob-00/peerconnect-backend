import { Router } from "express";
import { adminVerificationsController } from "../../controllers/adminVerifications.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { userIdParamSchema } from "../../validators/common.validator";
import { z } from "zod";

const verificationNotesSchema = z.object({
  notes: z.string().optional(),
});

export const adminVerificationsRouter = Router();

// GET /admin/verifications?status=pending_approval
adminVerificationsRouter.get(
  "/verifications",
  authenticate,
  requireAdmin,
  validateRequest({ query: z.object({ status: z.string().optional() }) }),
  adminVerificationsController.listPending
);

adminVerificationsRouter.get(
  "/verifications/:userId",
  authenticate,
  requireAdmin,
  validateRequest({ params: userIdParamSchema }),
  adminVerificationsController.getVerificationDetail
);

adminVerificationsRouter.patch(
  "/verifications/:userId/approve",
  authenticate,
  requireAdmin,
  validateRequest({ params: userIdParamSchema, body: verificationNotesSchema }),
  adminVerificationsController.approve
);

adminVerificationsRouter.patch(
  "/verifications/:userId/reject",
  authenticate,
  requireAdmin,
  validateRequest({ params: userIdParamSchema, body: verificationNotesSchema }),
  adminVerificationsController.reject
);

adminVerificationsRouter.patch(
  "/verifications/:userId/in-review",
  authenticate,
  requireAdmin,
  validateRequest({ params: userIdParamSchema, body: verificationNotesSchema }),
  adminVerificationsController.setInReview
);
