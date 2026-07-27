/*
  Warnings:

  - You are about to drop the column `isActive` on the `announcements` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('PUBLISHED', 'DRAFT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'DIRECT';
ALTER TYPE "NotificationType" ADD VALUE 'BROADCAST';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';
ALTER TYPE "Role" ADD VALUE 'MODERATOR';
ALTER TYPE "Role" ADD VALUE 'SUPPORT';

-- DropIndex
DROP INDEX "announcements_isActive_idx";

-- AlterTable
ALTER TABLE "announcements" DROP COLUMN "isActive",
ADD COLUMN     "status" "AnnouncementStatus" NOT NULL DEFAULT 'PUBLISHED';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "targetType" TEXT,
ADD COLUMN     "targetValue" TEXT;

-- CreateIndex
CREATE INDEX "announcements_status_idx" ON "announcements"("status");
