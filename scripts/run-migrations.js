const { Pool } = require('pg');

// SQL for all migrations - these are idempotent and safe to run multiple times
const MIGRATIONS = [
  {
    name: '20251113000000_add_smartphrase_model',
    sql: `
-- CreateTable (only if not exists)
CREATE TABLE IF NOT EXISTS "SmartPhrase" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmartPhrase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SmartPhrase_slug_key') THEN
        CREATE UNIQUE INDEX "SmartPhrase_slug_key" ON "SmartPhrase"("slug");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SmartPhrase_category_idx') THEN
        CREATE INDEX "SmartPhrase_category_idx" ON "SmartPhrase"("category");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SmartPhrase_slug_idx') THEN
        CREATE INDEX "SmartPhrase_slug_idx" ON "SmartPhrase"("slug");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SmartPhrase_usageCount_idx') THEN
        CREATE INDEX "SmartPhrase_usageCount_idx" ON "SmartPhrase"("usageCount");
    END IF;
END $$;
    `,
  },
  {
    name: '20251113000001_add_scenarios_and_procedures',
    sql: `
-- CreateTable Scenario (only if not exists)
CREATE TABLE IF NOT EXISTS "Scenario" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable Procedure (only if not exists)
CREATE TABLE IF NOT EXISTS "Procedure" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "indications" TEXT,
    "contraindications" TEXT,
    "equipment" TEXT,
    "steps" TEXT NOT NULL,
    "complications" TEXT,
    "tags" TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Procedure_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes for Scenario
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Scenario_slug_key') THEN
        CREATE UNIQUE INDEX "Scenario_slug_key" ON "Scenario"("slug");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Scenario_category_idx') THEN
        CREATE INDEX "Scenario_category_idx" ON "Scenario"("category");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Scenario_slug_idx') THEN
        CREATE INDEX "Scenario_slug_idx" ON "Scenario"("slug");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Scenario_viewCount_idx') THEN
        CREATE INDEX "Scenario_viewCount_idx" ON "Scenario"("viewCount");
    END IF;
END $$;

-- CreateIndexes for Procedure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Procedure_slug_key') THEN
        CREATE UNIQUE INDEX "Procedure_slug_key" ON "Procedure"("slug");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Procedure_category_idx') THEN
        CREATE INDEX "Procedure_category_idx" ON "Procedure"("category");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Procedure_slug_idx') THEN
        CREATE INDEX "Procedure_slug_idx" ON "Procedure"("slug");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Procedure_viewCount_idx') THEN
        CREATE INDEX "Procedure_viewCount_idx" ON "Procedure"("viewCount");
    END IF;
END $$;
    `,
  },
  {
    name: '20251115000000_add_page_model',
    sql: `
-- CreateEnum (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PageType') THEN
        CREATE TYPE "PageType" AS ENUM ('PROVIDER', 'PROCEDURE', 'SMARTPHRASE', 'SCENARIO', 'WIKI', 'FOLDER');
    END IF;
END $$;

-- CreateTable (only if not exists)
CREATE TABLE IF NOT EXISTS "Page" (
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

-- CreateIndexes (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Page_slug_key') THEN
        CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Page_providerId_key') THEN
        CREATE UNIQUE INDEX "Page_providerId_key" ON "Page"("providerId");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Page_procedureId_key') THEN
        CREATE UNIQUE INDEX "Page_procedureId_key" ON "Page"("procedureId");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Page_scenarioId_key') THEN
        CREATE UNIQUE INDEX "Page_scenarioId_key" ON "Page"("scenarioId");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Page_smartPhraseId_key') THEN
        CREATE UNIQUE INDEX "Page_smartPhraseId_key" ON "Page"("smartPhraseId");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Page_parentId_position_idx') THEN
        CREATE INDEX "Page_parentId_position_idx" ON "Page"("parentId", "position");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Page_type_deletedAt_idx') THEN
        CREATE INDEX "Page_type_deletedAt_idx" ON "Page"("type", "deletedAt");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Page_slug_idx') THEN
        CREATE INDEX "Page_slug_idx" ON "Page"("slug");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Page_category_idx') THEN
        CREATE INDEX "Page_category_idx" ON "Page"("category");
    END IF;
END $$;

-- AddForeignKeys (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Page_parentId_fkey' AND table_name = 'Page'
    ) THEN
        ALTER TABLE "Page" ADD CONSTRAINT "Page_parentId_fkey"
        FOREIGN KEY ("parentId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Page_providerId_fkey' AND table_name = 'Page'
    ) THEN
        ALTER TABLE "Page" ADD CONSTRAINT "Page_providerId_fkey"
        FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Page_procedureId_fkey' AND table_name = 'Page'
    ) THEN
        ALTER TABLE "Page" ADD CONSTRAINT "Page_procedureId_fkey"
        FOREIGN KEY ("procedureId") REFERENCES "Procedure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Page_scenarioId_fkey' AND table_name = 'Page'
    ) THEN
        ALTER TABLE "Page" ADD CONSTRAINT "Page_scenarioId_fkey"
        FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Page_smartPhraseId_fkey' AND table_name = 'Page'
    ) THEN
        ALTER TABLE "Page" ADD CONSTRAINT "Page_smartPhraseId_fkey"
        FOREIGN KEY ("smartPhraseId") REFERENCES "SmartPhrase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
    `,
  },
  {
    name: '20251117000000_add_animated_message',
    sql: `
-- CreateTable AnimatedMessage (only if not exists)
CREATE TABLE IF NOT EXISTS "AnimatedMessage" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnimatedMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes for AnimatedMessage
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'AnimatedMessage_order_idx') THEN
        CREATE INDEX "AnimatedMessage_order_idx" ON "AnimatedMessage"("order");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'AnimatedMessage_enabled_idx') THEN
        CREATE INDEX "AnimatedMessage_enabled_idx" ON "AnimatedMessage"("enabled");
    END IF;
END $$;

-- Insert default messages if table is empty
INSERT INTO "AnimatedMessage" ("id", "message", "order", "enabled", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    message,
    order_num,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (
    VALUES
        ('The best place for your documentation needs', 1),
        ('A magician pulls a rabbit out of a hat, an ER doctor pulls a rabbit out of a body cavity', 2),
        ('Love your neighbors like Dr. Gromis loves his US machine', 3)
) AS default_messages(message, order_num)
WHERE NOT EXISTS (SELECT 1 FROM "AnimatedMessage");
    `,
  },
  {
    name: '20251117000001_add_physician_directory_and_medications',
    sql: `
-- Update PageType enum to include new types (only if not exists)
DO $$
BEGIN
    -- Check if PHYSICIAN_DIRECTORY and MEDICATION values exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'PHYSICIAN_DIRECTORY'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PageType')
    ) THEN
        ALTER TYPE "PageType" ADD VALUE 'PHYSICIAN_DIRECTORY';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'MEDICATION'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PageType')
    ) THEN
        ALTER TYPE "PageType" ADD VALUE 'MEDICATION';
    END IF;
END $$;

-- CreateTable PhysicianDirectory (only if not exists)
CREATE TABLE IF NOT EXISTS "PhysicianDirectory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "tags" TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhysicianDirectory_pkey" PRIMARY KEY ("id")
);

-- CreateTable Medication (only if not exists)
CREATE TABLE IF NOT EXISTS "Medication" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "commonlyUsedFor" TEXT,
    "tags" TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes for PhysicianDirectory
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PhysicianDirectory_slug_key') THEN
        CREATE UNIQUE INDEX "PhysicianDirectory_slug_key" ON "PhysicianDirectory"("slug");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PhysicianDirectory_name_idx') THEN
        CREATE INDEX "PhysicianDirectory_name_idx" ON "PhysicianDirectory"("name");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PhysicianDirectory_specialty_idx') THEN
        CREATE INDEX "PhysicianDirectory_specialty_idx" ON "PhysicianDirectory"("specialty");
    END IF;
END $$;

-- CreateIndexes for Medication
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Medication_slug_key') THEN
        CREATE UNIQUE INDEX "Medication_slug_key" ON "Medication"("slug");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Medication_name_idx') THEN
        CREATE INDEX "Medication_name_idx" ON "Medication"("name");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Medication_type_idx') THEN
        CREATE INDEX "Medication_type_idx" ON "Medication"("type");
    END IF;
END $$;

-- Add new foreign key columns to Page table (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Page' AND column_name = 'physicianDirectoryId'
    ) THEN
        ALTER TABLE "Page" ADD COLUMN "physicianDirectoryId" TEXT;
        CREATE UNIQUE INDEX "Page_physicianDirectoryId_key" ON "Page"("physicianDirectoryId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Page' AND column_name = 'medicationId'
    ) THEN
        ALTER TABLE "Page" ADD COLUMN "medicationId" TEXT;
        CREATE UNIQUE INDEX "Page_medicationId_key" ON "Page"("medicationId");
    END IF;
END $$;

-- AddForeignKeys (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Page_physicianDirectoryId_fkey' AND table_name = 'Page'
    ) THEN
        ALTER TABLE "Page" ADD CONSTRAINT "Page_physicianDirectoryId_fkey"
        FOREIGN KEY ("physicianDirectoryId") REFERENCES "PhysicianDirectory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Page_medicationId_fkey' AND table_name = 'Page'
    ) THEN
        ALTER TABLE "Page" ADD CONSTRAINT "Page_medicationId_fkey"
        FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
    `,
  },
  {
    name: '20251122000000_add_icon_remove_difficulty_metrics',
    sql: `
-- Add icon column to Provider (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Provider' AND column_name = 'icon'
    ) THEN
        ALTER TABLE "Provider" ADD COLUMN "icon" TEXT;
    END IF;
END $$;

-- Drop old difficulty columns if they exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Provider' AND column_name = 'speedDifficulty'
    ) THEN
        ALTER TABLE "Provider" DROP COLUMN "speedDifficulty";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Provider' AND column_name = 'terminologyDifficulty'
    ) THEN
        ALTER TABLE "Provider" DROP COLUMN "terminologyDifficulty";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Provider' AND column_name = 'noteDifficulty'
    ) THEN
        ALTER TABLE "Provider" DROP COLUMN "noteDifficulty";
    END IF;
END $$;
    `,
  },
  {
    name: '20251122070000_add_home_page_content',
    sql: `
-- CreateTable HomePageContent (only if not exists)
CREATE TABLE IF NOT EXISTS "HomePageContent" (
    "id" TEXT NOT NULL,
    "announcementText" TEXT NOT NULL,
    "gettingStartedText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomePageContent_pkey" PRIMARY KEY ("id")
);

-- Insert default content if table is empty
INSERT INTO "HomePageContent" ("id", "announcementText", "gettingStartedText", "createdAt", "updatedAt")
SELECT
    'default',
    'Welcome! Check back here for important updates and announcements.',
    'Welcome to your home!

• Browse provider preferences and documentation
• Access procedure guides and protocols
• Find smart phrases for EPIC documentation
• Review critical scenarios and emergency protocols',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "HomePageContent");
    `,
  },
  {
    name: '20251122080000_fix_provider_cascade_delete',
    sql: `
-- Fix foreign key constraint for Page.providerId to CASCADE instead of SET NULL
-- This prevents orphaned PROVIDER pages when a Provider is deleted

DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Page_providerId_fkey' AND table_name = 'Page'
    ) THEN
        ALTER TABLE "Page" DROP CONSTRAINT "Page_providerId_fkey";
    END IF;

    -- Add new constraint with CASCADE delete
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Page_providerId_fkey' AND table_name = 'Page'
    ) THEN
        ALTER TABLE "Page" ADD CONSTRAINT "Page_providerId_fkey"
        FOREIGN KEY ("providerId") REFERENCES "Provider"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Also fix other entity foreign keys for consistency
    -- Procedure
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Page_procedureId_fkey' AND table_name = 'Page'
    ) THEN
        ALTER TABLE "Page" DROP CONSTRAINT "Page_procedureId_fkey";
        ALTER TABLE "Page" ADD CONSTRAINT "Page_procedureId_fkey"
        FOREIGN KEY ("procedureId") REFERENCES "Procedure"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Scenario
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Page_scenarioId_fkey' AND table_name = 'Page'
    ) THEN
        ALTER TABLE "Page" DROP CONSTRAINT "Page_scenarioId_fkey";
        ALTER TABLE "Page" ADD CONSTRAINT "Page_scenarioId_fkey"
        FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- SmartPhrase
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Page_smartPhraseId_fkey' AND table_name = 'Page'
    ) THEN
        ALTER TABLE "Page" DROP CONSTRAINT "Page_smartPhraseId_fkey";
        ALTER TABLE "Page" ADD CONSTRAINT "Page_smartPhraseId_fkey"
        FOREIGN KEY ("smartPhraseId") REFERENCES "SmartPhrase"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- PhysicianDirectory
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Page_physicianDirectoryId_fkey' AND table_name = 'Page'
    ) THEN
        ALTER TABLE "Page" DROP CONSTRAINT "Page_physicianDirectoryId_fkey";
        ALTER TABLE "Page" ADD CONSTRAINT "Page_physicianDirectoryId_fkey"
        FOREIGN KEY ("physicianDirectoryId") REFERENCES "PhysicianDirectory"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Medication
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Page_medicationId_fkey' AND table_name = 'Page'
    ) THEN
        ALTER TABLE "Page" DROP CONSTRAINT "Page_medicationId_fkey";
        ALTER TABLE "Page" ADD CONSTRAINT "Page_medicationId_fkey"
        FOREIGN KEY ("medicationId") REFERENCES "Medication"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Soft-delete any existing orphaned PROVIDER pages
-- These are pages with type='PROVIDER' but providerId=NULL
UPDATE "Page"
SET "deletedAt" = NOW(),
    "updatedAt" = NOW()
WHERE type = 'PROVIDER'
  AND "providerId" IS NULL
  AND "deletedAt" IS NULL;
    `,
  },
  {
    name: '20251125000000_add_terminology_model',
    sql: `
-- CreateTable Terminology (only if not exists)
CREATE TABLE IF NOT EXISTS "Terminology" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "examples" TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Terminology_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes for Terminology
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Terminology_slug_key') THEN
        CREATE UNIQUE INDEX "Terminology_slug_key" ON "Terminology"("slug");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Terminology_term_idx') THEN
        CREATE INDEX "Terminology_term_idx" ON "Terminology"("term");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Terminology_category_idx') THEN
        CREATE INDEX "Terminology_category_idx" ON "Terminology"("category");
    END IF;
END $$;
    `,
  },
];

async function runMigrations() {
  console.log('\n========================================');
  console.log('🔄 MIGRATION SCRIPT STARTED');
  console.log('========================================\n');

  // Check for database URL (try multiple env vars)
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.PRISMA_DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ CRITICAL: No database URL found!');
    console.log('Checked: DATABASE_URL, POSTGRES_URL, PRISMA_DATABASE_URL');
    console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES')));
    console.log('\n⚠️  Skipping migrations - database tables will NOT be created');
    console.log('========================================\n');
    return;
  }

  // Log which env var was used
  const envVarUsed = process.env.DATABASE_URL ? 'DATABASE_URL' :
                     process.env.POSTGRES_URL ? 'POSTGRES_URL' :
                     'PRISMA_DATABASE_URL';

  console.log(`✓ Using ${envVarUsed}`);
  console.log('  Connection string:', databaseUrl.replace(/:[^:@]+@/, ':****@')); // Hide password

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    // Test connection first
    console.log('\n📡 Testing database connection...');
    const client = await pool.connect();
    console.log('✓ Database connection successful');

    // Get database info
    const dbInfo = await client.query('SELECT current_database(), current_user, version()');
    console.log('  Database:', dbInfo.rows[0].current_database);
    console.log('  User:', dbInfo.rows[0].current_user);
    console.log('  PostgreSQL:', dbInfo.rows[0].version.split(',')[0]);

    client.release();

    console.log('\n🔧 Applying migrations...\n');

    let successCount = 0;
    let failCount = 0;

    for (const migration of MIGRATIONS) {
      console.log(`➜ Migration: ${migration.name}`);
      try {
        const startTime = Date.now();
        await pool.query(migration.sql);
        const duration = Date.now() - startTime;
        console.log(`  ✅ Completed in ${duration}ms\n`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ FAILED:`);
        console.error(`     Error: ${error.message}`);
        console.error(`     Code: ${error.code}`);
        console.error(`     Detail: ${error.detail || 'N/A'}`);
        console.error(`     Hint: ${error.hint || 'N/A'}\n`);
        failCount++;
      }
    }

    console.log('========================================');
    console.log(`✅ Migration Summary:`);
    console.log(`   ${successCount} succeeded`);
    console.log(`   ${failCount} failed`);
    console.log('========================================\n');

    if (failCount > 0) {
      console.warn('⚠️  Some migrations failed - check errors above');
      console.warn('⚠️  App will continue, but features may not work correctly\n');
    }

  } catch (error) {
    console.error('\n========================================');
    console.error('❌ MIGRATION FATAL ERROR:');
    console.error('========================================');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);
    console.error('========================================');
    console.error('⚠️  App will continue, but database features will NOT work');
    console.error('========================================\n');
  } finally {
    try {
      await pool.end();
      console.log('🔌 Database connection closed\n');
    } catch (error) {
      console.error('Error closing pool:', error.message);
    }
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(async () => {
      console.log('✅ Migration runner finished');

      // After migrations complete, run medication seed
      try {
        const { seedMedications } = require('./seed-medications.js');
        await seedMedications();
      } catch (error) {
        console.error('⚠️  Failed to seed medications:', error.message);
        console.log('   (This is non-critical, medications can be imported via admin UI)\n');
      }

      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
