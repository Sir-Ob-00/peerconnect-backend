import { Router } from "express";
import { adminStatsController } from "../../controllers/adminStats.controller";
import { authenticate, requireAdmin } from "../../middlewares/authenticate";

export const adminStatsRouter = Router();

adminStatsRouter.get(
  "/stats",
  authenticate,
  requireAdmin,
  adminStatsController.getStats
);
