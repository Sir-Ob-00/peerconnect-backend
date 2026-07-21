import { Router } from "express";
import { notificationController } from "../../controllers/notification.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { authenticate } from "../../middlewares/authenticate";
import { listNotificationsQuerySchema, notificationIdParamSchema } from "../../validators/notification.validator";

export const notificationRouter = Router();

/**
 * @openapi
 * /notifications:
 *   get:
 *     summary: Get the current user's notifications
 *     description: >
 *       Paginated, most recent first, plus an `unreadCount` that reflects every unread
 *       notification (not just the current page). Notifications are also pushed in real time
 *       over Socket.IO as the `notification:new` event — see the "Real-time chat" section of the
 *       README, which now covers notifications too.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated notifications.
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
 *                           items: { $ref: '#/components/schemas/Notification' }
 *                         pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *                         unreadCount: { type: integer, example: 3 }
 *       401:
 *         description: Not authenticated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
notificationRouter.get(
  "/notifications",
  authenticate,
  validateRequest({ query: listNotificationsQuerySchema }),
  notificationController.list
);

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     description: Idempotent — marking an already-read notification succeeds without error.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Notification marked read.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Notification' }
 *       403:
 *         description: This notification belongs to a different user.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Notification not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
notificationRouter.patch(
  "/notifications/:id/read",
  authenticate,
  validateRequest({ params: notificationIdParamSchema }),
  notificationController.markRead
);
