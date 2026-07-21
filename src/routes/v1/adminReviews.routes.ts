import { Router } from "express";
import { adminReviewsController } from "../../controllers/adminReviews.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminReviewsQuerySchema } from "../../validators/admin.validator";
import { uuidParamSchema } from "../../validators/common.validator";

export const adminReviewsRouter = Router();

adminReviewsRouter.get(
  "/reviews",
  authenticate,
  requireAdmin,
  validateRequest({ query: adminReviewsQuerySchema }),
  adminReviewsController.list
);

adminReviewsRouter.get(
  "/reviews/:userId",
  authenticate,
  requireAdmin,
  validateRequest({ params: uuidParamSchema }),
  adminReviewsController.getByUserId
);
