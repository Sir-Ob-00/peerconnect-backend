import { Router } from "express";
import { sessionController } from "../../controllers/session.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { authenticate, requireStudent } from "../../middlewares/authenticate";
import {
  createSessionSchema,
  listSessionsQuerySchema,
  sessionIdParamSchema,
} from "../../validators/session.validator";

export const sessionRouter = Router();

/**
 * @openapi
 * /sessions:
 *   post:
 *     summary: Request a learning session with another student
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiverId, skill, scheduledDate]
 *             properties:
 *               receiverId: { type: string, format: uuid }
 *               skill: { type: string, example: "React Native" }
 *               message: { type: string, example: "Could you help me with navigation?" }
 *               scheduledDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Session request created with status PENDING.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Session' }
 *       400:
 *         description: Requesting a session with yourself, or scheduledDate is in the past.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Receiver not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422:
 *         description: Validation failed.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
sessionRouter.post(
  "/sessions",
  authenticate,
  requireStudent,
  validateRequest({ body: createSessionSchema }),
  sessionController.requestSession
);

/**
 * @openapi
 * /sessions/requests:
 *   get:
 *     summary: View incoming session requests awaiting your response
 *     description: Only sessions where you are the receiver and status is still PENDING.
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated incoming requests.
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
 *                           items: { $ref: '#/components/schemas/Session' }
 *                         pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         description: Not authenticated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
sessionRouter.get(
  "/sessions/requests",
  authenticate,
  requireStudent,
  validateRequest({ query: listSessionsQuerySchema }),
  sessionController.listIncomingRequests
);

/**
 * @openapi
 * /sessions/history:
 *   get:
 *     summary: Full session history — sessions you sent and sessions you received, any status
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated session history.
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
 *                           items: { $ref: '#/components/schemas/Session' }
 *                         pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         description: Not authenticated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
sessionRouter.get(
  "/sessions/history",
  authenticate,
  requireStudent,
  validateRequest({ query: listSessionsQuerySchema }),
  sessionController.listHistory
);

/**
 * @openapi
 * /sessions/{id}/accept:
 *   patch:
 *     summary: Accept a pending session request
 *     description: >
 *       Only the receiver can accept. Requires the session to still be PENDING, and requires the
 *       receiver's `isAvailable` flag to be true (Phase 5 availability check).
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Session accepted.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Session' }
 *       400:
 *         description: Receiver is currently marked unavailable.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Caller is not the receiver of this session.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Session not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Session is no longer pending.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
sessionRouter.patch(
  "/sessions/:id/accept",
  authenticate,
  requireStudent,
  validateRequest({ params: sessionIdParamSchema }),
  sessionController.accept
);

/**
 * @openapi
 * /sessions/{id}/reject:
 *   patch:
 *     summary: Reject a pending session request
 *     description: Only the receiver can reject. Requires the session to still be PENDING.
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Session rejected.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Session' }
 *       403:
 *         description: Caller is not the receiver of this session.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Session not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Session is no longer pending.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
sessionRouter.patch(
  "/sessions/:id/reject",
  authenticate,
  requireStudent,
  validateRequest({ params: sessionIdParamSchema }),
  sessionController.reject
);

/**
 * @openapi
 * /sessions/{id}/cancel:
 *   patch:
 *     summary: Cancel a pending or accepted session
 *     description: Either participant (requester or receiver) can cancel, while the session is still PENDING or ACCEPTED.
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Session cancelled.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Session' }
 *       403:
 *         description: Caller is not a participant in this session.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Session not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Session can no longer be cancelled (already rejected/cancelled/completed).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
sessionRouter.patch(
  "/sessions/:id/cancel",
  authenticate,
  requireStudent,
  validateRequest({ params: sessionIdParamSchema }),
  sessionController.cancel
);

/**
 * @openapi
 * /sessions/{id}/complete:
 *   patch:
 *     summary: Mark an accepted session as completed
 *     description: Either participant (requester or receiver) can mark a session complete, only while it's ACCEPTED.
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Session marked completed.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Session' }
 *       403:
 *         description: Caller is not a participant in this session.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Session not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Session is not currently accepted.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
sessionRouter.patch(
  "/sessions/:id/complete",
  authenticate,
  validateRequest({ params: sessionIdParamSchema }),
  sessionController.complete
);
