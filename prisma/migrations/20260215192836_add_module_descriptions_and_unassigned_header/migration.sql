-- AlterTable
ALTER TABLE "course" ADD COLUMN     "showUnassignedHeader" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "module" ADD COLUMN     "description" TEXT;
