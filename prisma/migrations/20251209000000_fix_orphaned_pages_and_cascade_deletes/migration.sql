-- Migration: Fix orphaned pages and ensure CASCADE deletes
-- Issue: Orphaned Page records exist with type='PROVIDER' but providerId=NULL
-- Solution: Clean up orphaned pages and update foreign key constraints to CASCADE

-- Step 1: Soft-delete orphaned PROVIDER pages
UPDATE "Page"
SET "deletedAt" = NOW()
WHERE type = 'PROVIDER'
  AND "providerId" IS NULL
  AND "deletedAt" IS NULL;

-- Step 2: Soft-delete orphaned PROCEDURE pages
UPDATE "Page"
SET "deletedAt" = NOW()
WHERE type = 'PROCEDURE'
  AND "procedureId" IS NULL
  AND "deletedAt" IS NULL;

-- Step 3: Soft-delete orphaned SCENARIO pages
UPDATE "Page"
SET "deletedAt" = NOW()
WHERE type = 'SCENARIO'
  AND "scenarioId" IS NULL
  AND "deletedAt" IS NULL;

-- Step 4: Soft-delete orphaned SMARTPHRASE pages
UPDATE "Page"
SET "deletedAt" = NOW()
WHERE type = 'SMARTPHRASE'
  AND "smartPhraseId" IS NULL
  AND "deletedAt" IS NULL;

-- Step 5: Soft-delete orphaned PHYSICIAN_DIRECTORY pages
UPDATE "Page"
SET "deletedAt" = NOW()
WHERE type = 'PHYSICIAN_DIRECTORY'
  AND "physicianDirectoryId" IS NULL
  AND "deletedAt" IS NULL;

-- Step 6: Soft-delete orphaned MEDICATION pages
UPDATE "Page"
SET "deletedAt" = NOW()
WHERE type = 'MEDICATION'
  AND "medicationId" IS NULL
  AND "deletedAt" IS NULL;

-- Step 7: Update foreign key constraints to use CASCADE instead of SET NULL
-- This ensures that when a Provider/Procedure/etc is deleted, the associated Page is also deleted

-- Provider constraint
ALTER TABLE "Page" DROP CONSTRAINT IF EXISTS "Page_providerId_fkey";
ALTER TABLE "Page" ADD CONSTRAINT "Page_providerId_fkey"
  FOREIGN KEY ("providerId") REFERENCES "Provider"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Procedure constraint
ALTER TABLE "Page" DROP CONSTRAINT IF EXISTS "Page_procedureId_fkey";
ALTER TABLE "Page" ADD CONSTRAINT "Page_procedureId_fkey"
  FOREIGN KEY ("procedureId") REFERENCES "Procedure"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Scenario constraint
ALTER TABLE "Page" DROP CONSTRAINT IF EXISTS "Page_scenarioId_fkey";
ALTER TABLE "Page" ADD CONSTRAINT "Page_scenarioId_fkey"
  FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- SmartPhrase constraint
ALTER TABLE "Page" DROP CONSTRAINT IF EXISTS "Page_smartPhraseId_fkey";
ALTER TABLE "Page" ADD CONSTRAINT "Page_smartPhraseId_fkey"
  FOREIGN KEY ("smartPhraseId") REFERENCES "SmartPhrase"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- PhysicianDirectory constraint
ALTER TABLE "Page" DROP CONSTRAINT IF EXISTS "Page_physicianDirectoryId_fkey";
ALTER TABLE "Page" ADD CONSTRAINT "Page_physicianDirectoryId_fkey"
  FOREIGN KEY ("physicianDirectoryId") REFERENCES "PhysicianDirectory"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Medication constraint
ALTER TABLE "Page" DROP CONSTRAINT IF EXISTS "Page_medicationId_fkey";
ALTER TABLE "Page" ADD CONSTRAINT "Page_medicationId_fkey"
  FOREIGN KEY ("medicationId") REFERENCES "Medication"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
