import { Router } from "express";
import { studentDiscoveryController } from "../../controllers/studentDiscovery.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { authenticate } from "../../middlewares/authenticate";
import { recommendationsQuerySchema, searchStudentsQuerySchema } from "../../validators/student.validator";

export const studentRouter = Router();

/**
 * @openapi
 * /students/recommendations:
 *   get:
 *     summary: Get recommended students based on shared skills and learning interests
 *     description: >
 *       Scored by simple overlap counting (shared skills + shared learning interests) against the
 *       caller's own profile — not an AI/ML ranking system. Returns an empty list if the caller's
 *       profile has no skills or learning interests set yet.
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 10 }
 *     responses:
 *       200:
 *         description: Recommended students, highest score first.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/RecommendedStudent' }
 *       401:
 *         description: Not authenticated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
studentRouter.get(
  "/students/recommendations",
  authenticate,
  validateRequest({ query: recommendationsQuerySchema }),
  studentDiscoveryController.recommendations
);

/**
 * @openapi
 * /students:
 *   get:
 *     summary: Search and filter students
 *     description: >
 *       `search` matches first name, last name, department, skills, and learning interests.
 *       `department` and `skills` narrow results further and can be combined with `search`.
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         example: React
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *         example: Computer Science
 *       - in: query
 *         name: skills
 *         schema: { type: string }
 *         description: Comma-separated list of skills. Matches students with at least one of them.
 *         example: React,Node.js
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated list of matching students.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         data:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/PublicStudentProfile' }
 *                         pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         description: Not authenticated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422:
 *         description: Invalid query parameters.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
studentRouter.get(
  "/students",
  authenticate,
  validateRequest({ query: searchStudentsQuerySchema }),
  studentDiscoveryController.search
);
