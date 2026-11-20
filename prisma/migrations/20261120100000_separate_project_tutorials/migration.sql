-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ContentType" AS ENUM ('COURSE', 'PROJECT_TUTORIAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "CategoryScope" AS ENUM ('BOTH', 'COURSE', 'PROJECT_TUTORIAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: course
ALTER TABLE "course"
    ADD COLUMN IF NOT EXISTS "contentType" "ContentType" NOT NULL DEFAULT 'COURSE',
    ADD COLUMN IF NOT EXISTS "demoUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "starterRepoUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "githubUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "techStack" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS "prerequisites" TEXT,
    ADD COLUMN IF NOT EXISTS "deliverables" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable: course_category
ALTER TABLE "course_category"
    ADD COLUMN IF NOT EXISTS "scope" "CategoryScope" NOT NULL DEFAULT 'BOTH';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "course_contentType_idx" ON "course"("contentType");
CREATE INDEX IF NOT EXISTS "course_contentType_status_idx" ON "course"("contentType", "status");
CREATE INDEX IF NOT EXISTS "course_category_scope_idx" ON "course_category"("scope");
