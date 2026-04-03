-- AlterTable
ALTER TABLE "lesson" ADD COLUMN     "moduleId" TEXT;

-- CreateTable
CREATE TABLE "module" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "module_courseId_idx" ON "module"("courseId");

-- CreateIndex
CREATE INDEX "lesson_moduleId_idx" ON "lesson"("moduleId");

-- AddForeignKey
ALTER TABLE "module" ADD CONSTRAINT "module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "module"("id") ON DELETE SET NULL ON UPDATE CASCADE;
