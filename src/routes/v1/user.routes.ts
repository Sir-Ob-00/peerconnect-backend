import { Router } from "express";
import { userController } from "../../controllers/user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { authenticate } from "../../middlewares/authenticate";
import { updateMeSchema } from "../../validators/user.validator";

export const userRouter = Router();

/**
 * @openapi
 * /users/me:
 *   patch:
 *     summary: Update the current user's basic account info
 *     description: Email cannot be changed at this stage. Provide at least one field.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string, example: Ama }
 *               lastName: { type: string, example: Mensah }
 *               profileImage: { type: string, format: uri, example: https://res.cloudinary.com/demo/image/upload/avatar.jpg }
 *     responses:
 *       200:
 *         description: Account updated.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Not authenticated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422:
 *         description: Validation failed.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
userRouter.patch("/users/me", authenticate, validateRequest({ body: updateMeSchema }), userController.updateMe);

/**
 * @openapi
 * /users/me:
 *   delete:
 *     summary: Soft-delete the current user's own account
 *     description: The record is not physically removed. The account is marked deleted and can no longer log in.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401:
 *         description: Not authenticated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
userRouter.delete("/users/me", authenticate, userController.deleteMe);
