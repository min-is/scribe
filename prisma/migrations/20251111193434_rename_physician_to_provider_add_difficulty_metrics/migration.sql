-- AlterTable: Rename Physician to Provider
ALTER TABLE "Physician" RENAME TO "Provider";

-- AlterTable: Rename constraints
ALTER TABLE "Provider" RENAME CONSTRAINT "Physician_pkey" TO "Provider_pkey";

-- DropIndex: Drop old indexes
DROP INDEX "Physician_slug_key";
DROP INDEX "Physician_slug_idx";

-- AlterTable: Drop specialty column
ALTER TABLE "Provider" DROP COLUMN "specialty";

-- AlterTable: Add difficulty metrics
ALTER TABLE "Provider" ADD COLUMN "generalDifficulty" INTEGER;
ALTER TABLE "Provider" ADD COLUMN "speedDifficulty" INTEGER;
ALTER TABLE "Provider" ADD COLUMN "terminologyDifficulty" INTEGER;
ALTER TABLE "Provider" ADD COLUMN "noteDifficulty" INTEGER;

-- AlterTable: Add analytics tracking
ALTER TABLE "Provider" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Provider" ADD COLUMN "searchClickCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex: Recreate slug indexes with new name
CREATE UNIQUE INDEX "Provider_slug_key" ON "Provider"("slug");
CREATE INDEX "Provider_slug_idx" ON "Provider"("slug");

-- CreateIndex: Add new indexes for analytics
CREATE INDEX "Provider_viewCount_idx" ON "Provider"("viewCount");
CREATE INDEX "Provider_searchClickCount_idx" ON "Provider"("searchClickCount");
