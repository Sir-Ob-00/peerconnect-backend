import { Router } from "express";
import { adminDashboardController } from "../../controllers/adminDashboard.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";

export const adminDashboardRouter = Router();

adminDashboardRouter.get(
  "/dashboard",
  authenticate,
  requireAdmin,
  adminDashboardController.getStats
);
