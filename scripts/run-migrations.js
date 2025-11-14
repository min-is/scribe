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
];

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not set, skipping migrations');
    return;
  }

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
      } catch (error) {
        console.error(`  ❌ ${migration.name} failed:`, error.message);
        // Continue with other migrations even if one fails
      }
    }

    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    // Don't throw - allow the app to start even if migrations fail
    console.error('⚠️  App will continue, but some features may not work');
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ Migration runner finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
