import { Router } from "express";
import { studentDiscoveryController } from "../../controllers/studentDiscovery.controller";
import { authenticate, requireStudent } from "../../middlewares/authenticate";
import { validateRequest } from "../../middlewares/validateRequest";
import { searchStudentsQuerySchema } from "../../validators/student.validator";

export const mobileSearchRouter = Router();

mobileSearchRouter.get(
  "/search/students",
  authenticate,
  requireStudent,
  validateRequest({ query: searchStudentsQuerySchema }),
  studentDiscoveryController.search
);