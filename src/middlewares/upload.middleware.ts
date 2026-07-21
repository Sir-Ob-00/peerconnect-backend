import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(ApiError.badRequest("Only JPEG, PNG, and WebP images are allowed."));
    return;
  }
  cb(null, true);
}

/**
 * Memory storage (not disk) — the file only ever exists as an in-memory
 * buffer, which is exactly what `uploadImageBuffer` needs to stream
 * straight to Cloudinary without writing anything to local disk.
 */
export const uploadProfilePhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_PROFILE_PHOTO_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter,
}).single("photo");

/** Same constraints as profile photos (image types, memory storage) but its own size limit and field name — chat images are sent under "image", not "photo". */
export const uploadChatImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_CHAT_IMAGE_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter,
}).single("image");
