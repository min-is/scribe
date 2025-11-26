import { Pool } from 'pg';

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
    name: '20251126000000_convert_scenarios_procedures_to_rich_text',
    sql: `
-- AlterTable Scenario: Convert content from TEXT to JSONB
DO $$
BEGIN
  -- Check if content column exists and is TEXT type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Scenario'
    AND column_name = 'content'
    AND data_type = 'text'
  ) THEN
    -- Convert existing text content to TipTap JSON format
    UPDATE "Scenario"
    SET content = jsonb_build_object(
      'type', 'doc',
      'content', jsonb_build_array(
        jsonb_build_object(
          'type', 'paragraph',
          'content', jsonb_build_array(
            jsonb_build_object('type', 'text', 'text', content)
          )
        )
      )
    )::text
    WHERE content IS NOT NULL
    AND content !~ '^\\s*\\{';  -- Only convert if not already JSON

    -- Change column type to JSONB
    ALTER TABLE "Scenario" ALTER COLUMN "content" TYPE JSONB USING content::jsonb;
  END IF;
END $$;

-- AlterTable Procedure: Remove old fields and convert steps to JSONB
DO $$
BEGIN
  -- Drop indications column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Procedure'
    AND column_name = 'indications'
  ) THEN
    ALTER TABLE "Procedure" DROP COLUMN "indications";
  END IF;

  -- Drop contraindications column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Procedure'
    AND column_name = 'contraindications'
  ) THEN
    ALTER TABLE "Procedure" DROP COLUMN "contraindications";
  END IF;

  -- Drop equipment column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Procedure'
    AND column_name = 'equipment'
  ) THEN
    ALTER TABLE "Procedure" DROP COLUMN "equipment";
  END IF;

  -- Convert steps from TEXT to JSONB
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Procedure'
    AND column_name = 'steps'
    AND data_type = 'text'
  ) THEN
    -- Convert existing text steps to TipTap JSON format
    UPDATE "Procedure"
    SET steps = jsonb_build_object(
      'type', 'doc',
      'content', jsonb_build_array(
        jsonb_build_object(
          'type', 'paragraph',
          'content', jsonb_build_array(
            jsonb_build_object('type', 'text', 'text', steps)
          )
        )
      )
    )::text
    WHERE steps IS NOT NULL
    AND steps !~ '^\\s*\\{';  -- Only convert if not already JSON

    -- Change column type to JSONB
    ALTER TABLE "Procedure" ALTER COLUMN "steps" TYPE JSONB USING steps::jsonb;
  END IF;
END $$;
    `,
  },
];

export async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Running automatic migrations...');

    for (const migration of MIGRATIONS) {
      console.log(`  ➜ Applying ${migration.name}...`);
      try {
        await pool.query(migration.sql);
        console.log(`  ✅ ${migration.name} completed`);
      } catch (error: any) {
        console.error(`  ❌ ${migration.name} failed:`, error.message);
        // Continue with other migrations even if one fails
      }
    }

    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration runner finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration runner failed:', error);
      process.exit(1);
    });
}
