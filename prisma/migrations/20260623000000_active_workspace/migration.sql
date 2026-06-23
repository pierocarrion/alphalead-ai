-- AlterTable
-- Pointer to the workspace the user last opened. Soft reference (no FK)
-- so deleting a workspace never blocks on this column.
ALTER TABLE "UserProfile" ADD COLUMN "lastActiveWorkspaceId" TEXT;
