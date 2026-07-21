import { Readable } from "stream";
import { cloudinary } from "../config/cloudinary";
import { env } from "../config/env";

export interface UploadedImage {
  secureUrl: string;
  publicId: string;
}

/**
 * Uploads an in-memory image buffer (from multer's memory storage) to
 * Cloudinary and resolves with the resulting secure URL. Kept as a thin,
 * isolated wrapper — like the repository pattern for Prisma — so services
 * depend on this function rather than the Cloudinary SDK directly, and
 * tests can mock this one module instead of hitting the network.
 *
 * Uses a stable `publicId` (one per user) with `overwrite: true` so
 * re-uploading a profile photo replaces the previous one instead of
 * accumulating orphaned images in the Cloudinary account.
 */
export function uploadImageBuffer(buffer: Buffer, publicId: string): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: env.CLOUDINARY_UPLOAD_FOLDER,
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
        transformation: [{ width: 512, height: 512, crop: "fill", gravity: "face" }],
      },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Cloudinary upload failed with no result."));
        }
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

/**
 * Uploads a chat image. Separate from `uploadImageBuffer` (profile photos)
 * on purpose: a different folder, a random per-upload public id (Cloudinary
 * generates one) rather than one stable id per user — each chat image is a
 * distinct piece of content, not a replaceable avatar — no face-crop
 * transformation, and no overwrite.
 */
export function uploadChatImageBuffer(buffer: Buffer): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: env.CLOUDINARY_CHAT_UPLOAD_FOLDER,
        resource_type: "image",
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Cloudinary upload failed with no result."));
        }
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}
