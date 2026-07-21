import { Router } from "express";
import { healthController } from "../../controllers/health.controller";

export const healthRouter = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Check whether the API is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: The server is up and responding.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               status: success
 *               message: Server is running
 */
healthRouter.get("/health", healthController.getHealth);
