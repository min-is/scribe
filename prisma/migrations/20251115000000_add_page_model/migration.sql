-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('PROVIDER', 'PROCEDURE', 'SMARTPHRASE', 'SCENARIO', 'WIKI', 'FOLDER');

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "textContent" TEXT,
    "type" "PageType" NOT NULL,
    "parentId" TEXT,
    "position" TEXT NOT NULL DEFAULT 'a0',
    "icon" TEXT,
    "coverPhoto" TEXT,
    "category" TEXT,
    "tags" TEXT[],
    "providerId" TEXT,
    "procedureId" TEXT,
    "scenarioId" TEXT,
    "smartPhraseId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Page_providerId_key" ON "Page"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_procedureId_key" ON "Page"("procedureId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_scenarioId_key" ON "Page"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_smartPhraseId_key" ON "Page"("smartPhraseId");

-- CreateIndex
CREATE INDEX "Page_parentId_position_idx" ON "Page"("parentId", "position");

-- CreateIndex
CREATE INDEX "Page_type_deletedAt_idx" ON "Page"("type", "deletedAt");

-- CreateIndex
CREATE INDEX "Page_slug_idx" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "Page_category_idx" ON "Page"("category");

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "Procedure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_smartPhraseId_fkey" FOREIGN KEY ("smartPhraseId") REFERENCES "SmartPhrase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
