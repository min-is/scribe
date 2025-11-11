-- CreateTable
CREATE TABLE "Physician" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT,
    "credentials" TEXT,
    "noteTemplate" TEXT,
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Physician_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Physician_slug_key" ON "Physician"("slug");

-- CreateIndex
CREATE INDEX "Physician_slug_idx" ON "Physician"("slug");
