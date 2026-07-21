import { Router } from "express";
import { studentProfileController } from "../../controllers/studentProfile.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { authenticate } from "../../middlewares/authenticate";
import { uploadProfilePhoto } from "../../middlewares/upload.middleware";
import { updateStudentProfileSchema } from "../../validators/studentProfile.validator";
import { uuidParamSchema } from "../../validators/common.validator";

export const profileRouter = Router();

/**
 * @openapi
 * /profile/me:
 *   get:
 *     summary: Get the current user's account info + student profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account info and profile. A profile is auto-created (empty) on first access if one doesn't exist yet.
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
 *                         user: { $ref: '#/components/schemas/User' }
 *                         profile: { $ref: '#/components/schemas/StudentProfile' }
 *       401:
 *         description: Not authenticated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
profileRouter.get("/profile/me", authenticate, studentProfileController.getMe);

/**
 * @openapi
 * /profile/me:
 *   patch:
 *     summary: Update the current user's student profile
 *     description: Provide at least one field. Only the caller's own profile can ever be updated by this endpoint.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               department: { type: string, example: Computer Science }
 *               level: { type: string, example: Level 300 }
 *               skills:
 *                 type: array
 *                 items: { type: string }
 *                 example: [React Native, UI Design, Databases]
 *               learningInterests:
 *                 type: array
 *                 items: { type: string }
 *                 example: [Machine Learning, Public Speaking]
 *               bio: { type: string, example: "CS student who loves teaching mobile dev." }
 *               availability: { type: string, example: "Weekdays after 5pm, weekends anytime" }
 *               isAvailable:
 *                 type: boolean
 *                 example: true
 *                 description: Quick toggle checked by Phase 5's session-accept flow. Turn off to signal you're not currently taking new session requests.
 *     responses:
 *       200:
 *         description: Updated profile.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/StudentProfile' }
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
profileRouter.patch(
  "/profile/me",
  authenticate,
  validateRequest({ body: updateStudentProfileSchema }),
  studentProfileController.updateMe
);

/**
 * @openapi
 * /profile/photo:
 *   post:
 *     summary: Upload/replace the current user's profile photo
 *     description: Uploads to Cloudinary and stores the resulting secure URL. Re-uploading replaces the previous photo.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [photo]
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: JPEG, PNG, or WebP image (max size configured via MAX_PROFILE_PHOTO_SIZE_MB).
 *     responses:
 *       200:
 *         description: Updated profile, including the new profilePhoto URL.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/StudentProfile' }
 *       400:
 *         description: No file provided, wrong file type, or file too large.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Not authenticated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
profileRouter.post("/profile/photo", authenticate, uploadProfilePhoto, studentProfileController.uploadPhoto);

/**
 * @openapi
 * /profile/{id}:
 *   get:
 *     summary: Get another student's public profile
 *     description: Public — no authentication required. Excludes email, role, account status, and other account-internal fields.
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: The target user's id.
 *     responses:
 *       200:
 *         description: Public profile.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/PublicStudentProfile' }
 *       404:
 *         description: No such student.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422:
 *         description: id is not a valid UUID.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
profileRouter.get("/profile/:id", validateRequest({ params: uuidParamSchema }), studentProfileController.getById);
