-- CreateTable
CREATE TABLE "SmartPhrase" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartPhrase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmartPhrase_slug_key" ON "SmartPhrase"("slug");

-- CreateIndex
CREATE INDEX "SmartPhrase_category_idx" ON "SmartPhrase"("category");

-- CreateIndex
CREATE INDEX "SmartPhrase_slug_idx" ON "SmartPhrase"("slug");

-- CreateIndex
CREATE INDEX "SmartPhrase_usageCount_idx" ON "SmartPhrase"("usageCount");
