import { Router } from "express";
import { reviewController } from "../../controllers/review.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { authenticate } from "../../middlewares/authenticate";
import { createReviewSchema, listReviewsQuerySchema, reviewsByUserParamSchema } from "../../validators/review.validator";

export const reviewRouter = Router();

/**
 * @openapi
 * /reviews:
 *   post:
 *     summary: Leave a review for the other participant in a completed session
 *     description: >
 *       The receiver of the review is derived automatically (whichever session participant isn't
 *       the caller) — it's never supplied in the request body. Only sessions with status
 *       COMPLETED can be reviewed, only by one of its two participants, and only once per session.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, rating]
 *             properties:
 *               sessionId: { type: string, format: uuid }
 *               rating: { type: integer, minimum: 1, maximum: 5, example: 5 }
 *               comment: { type: string, example: "Really patient and explained things clearly!" }
 *     responses:
 *       201:
 *         description: Review created.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Review' }
 *       400:
 *         description: Session is not completed yet (or the self-review safety check failed).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Caller was not a participant in this session.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Session not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: This session has already been reviewed.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422:
 *         description: Validation failed.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
reviewRouter.post("/reviews", authenticate, validateRequest({ body: createReviewSchema }), reviewController.createReview);

/**
 * @openapi
 * /reviews/{userId}:
 *   get:
 *     summary: Get the reviews a student has received, plus their average rating
 *     description: Public — no authentication required.
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 10 }
 *     responses:
 *       200:
 *         description: Reviews, pagination, and the rating summary (computed over ALL reviews, not just the current page).
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
 *                           items: { $ref: '#/components/schemas/Review' }
 *                         pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *                         summary: { $ref: '#/components/schemas/RatingSummary' }
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422:
 *         description: userId is not a valid UUID.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
reviewRouter.get(
  "/reviews/:userId",
  validateRequest({ params: reviewsByUserParamSchema, query: listReviewsQuerySchema }),
  reviewController.listForUser
);
