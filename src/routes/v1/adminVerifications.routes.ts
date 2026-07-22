import { Router } from "express";
import { adminVerificationsController } from "../../controllers/adminVerifications.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { uuidParamSchema } from "../../validators/common.validator";
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

// PATCH /admin/verifications/:userId/approve
adminVerificationsRouter.patch(
  "/verifications/:userId/approve",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema, body: verificationNotesSchema }),
  adminVerificationsController.approve
);

// PATCH /admin/verifications/:userId/reject
adminVerificationsRouter.patch(
  "/verifications/:userId/reject",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema, body: verificationNotesSchema }),
  adminVerificationsController.reject
);

// PATCH /admin/verifications/:userId/in-review
adminVerificationsRouter.patch(
  "/verifications/:userId/in-review",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema, body: verificationNotesSchema }),
  adminVerificationsController.setInReview
);
