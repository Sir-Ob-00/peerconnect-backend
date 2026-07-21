import { Router } from "express";
import { adminVerificationsController } from "../../controllers/adminVerifications.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { asyncHandler } from "../../utils/asyncHandler";

export const adminVerificationsRouter = Router();

// GET /admin/verifications?status=pending
adminVerificationsRouter.get(
  "/verifications",
  authenticate,
  requireAdmin,
  asyncHandler(adminVerificationsController.listPending)
);

// PATCH /admin/verifications/:userId/approve
adminVerificationsRouter.patch(
  "/verifications/:userId/approve",
  authenticate,
  requireAdmin,
  asyncHandler(adminVerificationsController.approve)
);

// PATCH /admin/verifications/:userId/reject
adminVerificationsRouter.patch(
  "/verifications/:userId/reject",
  authenticate,
  requireAdmin,
  asyncHandler(adminVerificationsController.reject)
);
