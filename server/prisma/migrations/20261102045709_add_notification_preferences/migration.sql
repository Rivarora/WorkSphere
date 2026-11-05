-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "projectNotifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taskNotifications" BOOLEAN NOT NULL DEFAULT true;
